import { supabase } from "../lib/supabase";
import { requireMerchantCanReceiveOrders } from "./profileCompletionRepository";

export type MerchantProductResult = {
  ok: boolean;
  message: string;
};

export type MerchantUploadResult =
  | {
      ok: true;
      message: string;
      publicUrl: string;
    }
  | {
      ok: false;
      message: string;
    };

export async function createMerchantProduct(
  name: string,
  priceNaira: number,
  imageUrl?: string
): Promise<MerchantProductResult> {
  const trimmedName = name.trim();
  const trimmedImageUrl = imageUrl?.trim();

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

  const completion = await requireMerchantCanReceiveOrders(user.id);

  if (!completion.ok) {
    return completion;
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
      image_url: trimmedImageUrl || null,
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

export async function updateMerchantStorefront(
  businessName: string,
  neighborhood: string
): Promise<MerchantProductResult> {
  const trimmedName = businessName.trim();
  const trimmedNeighborhood = neighborhood.trim();

  if (!trimmedName) {
    return { ok: false, message: "Enter a storefront name." };
  }

  if (!supabase) {
    return { ok: false, message: "Supabase is not configured for storefront updates." };
  }

  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError) {
    return { ok: false, message: `Session lookup failed: ${userError.message}` };
  }

  if (!user) {
    return { ok: false, message: "Sign in with Google before updating your storefront." };
  }

  const completion = await requireMerchantCanReceiveOrders(user.id);

  if (!completion.ok) {
    return completion;
  }

  const result = await supabase
    .from("merchant_profiles")
    .update({
      business_name: trimmedName,
      neighborhood: trimmedNeighborhood || null
    })
    .eq("owner_id", user.id)
    .select("id")
    .maybeSingle();

  if (result.error) {
    return { ok: false, message: `Storefront update failed: ${result.error.message}` };
  }

  if (!result.data) {
    return { ok: false, message: "Activate a merchant profile before saving storefront details." };
  }

  return { ok: true, message: "Storefront profile synced to Supabase." };
}

export async function uploadMerchantProductImage(
  uri: string,
  fileName = `product-${Date.now()}.jpg`
): Promise<MerchantUploadResult> {
  if (!supabase) {
    return { ok: false, message: "Supabase is not configured for media upload." };
  }

  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError) {
    return { ok: false, message: `Session lookup failed: ${userError.message}` };
  }

  if (!user) {
    return { ok: false, message: "Sign in with Google before uploading product images." };
  }

  const response = await fetch(uri);
  const blob = await response.blob();
  const cleanName = fileName.replace(/[^a-zA-Z0-9._-]/g, "-");
  const storagePath = `${user.id}/${Date.now()}-${cleanName}`;
  const uploadResult = await supabase.storage
    .from("product-media")
    .upload(storagePath, blob, {
      contentType: blob.type || "image/jpeg",
      upsert: true
    });

  if (uploadResult.error) {
    return { ok: false, message: `Image upload failed: ${uploadResult.error.message}` };
  }

  const publicUrl = supabase.storage.from("product-media").getPublicUrl(storagePath).data.publicUrl;

  return { ok: true, message: "Product image uploaded.", publicUrl };
}
