import { supabase } from "../lib/supabase";

export type MerchantProductResult = {
  ok: boolean;
  message: string;
};

export async function createMerchantProduct(
  name: string,
  priceNaira: number
): Promise<MerchantProductResult> {
  const trimmedName = name.trim();

  if (!trimmedName) {
    return { ok: false, message: "Enter a product name." };
  }

  if (!Number.isFinite(priceNaira) || priceNaira <= 0) {
    return { ok: false, message: "Enter a valid product price." };
  }

  if (!supabase) {
    return { ok: false, message: "Supabase is not configured for product creation." };
  }

  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError) {
    return { ok: false, message: `Session lookup failed: ${userError.message}` };
  }

  if (!user) {
    return { ok: false, message: "Sign in with Google before creating merchant products." };
  }

  const merchantResult = await supabase
    .from("merchant_profiles")
    .select("id")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (merchantResult.error) {
    return { ok: false, message: `Merchant lookup failed: ${merchantResult.error.message}` };
  }

  if (!merchantResult.data) {
    return { ok: false, message: "Activate a merchant profile before adding products." };
  }

  const productResult = await supabase
    .from("products")
    .insert({
      merchant_id: merchantResult.data.id,
      name: trimmedName,
      description: "Merchant-created ChowTrek item",
      price_naira: Math.round(priceNaira),
      status: "food_ready",
      is_active: true
    })
    .select("id")
    .single();

  if (productResult.error) {
    return { ok: false, message: `Product creation failed: ${productResult.error.message}` };
  }

  const timelineResult = await supabase.from("vendor_timeline_events").insert({
    merchant_id: merchantResult.data.id,
    type: "new_product",
    title: `${trimmedName} added`,
    body: "New product is available on ChowTrek.",
    product_id: productResult.data.id
  });

  if (timelineResult.error) {
    return {
      ok: false,
      message: `Product created, but timeline update failed: ${timelineResult.error.message}`
    };
  }

  return { ok: true, message: `${trimmedName} added to your storefront.` };
}
