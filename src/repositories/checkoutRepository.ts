import { supabase } from "../lib/supabase";
import { flutterwavePaymentUrl, isFlutterwaveConfigured } from "../lib/productionConfig";
import { CartItem, PaymentMode } from "../types/domain";

export type CheckoutResult = {
  ok: boolean;
  message: string;
  orderId?: string;
  paymentUrl?: string;
};

const deliveryFeeNaira = 700;

export async function createCheckoutOrder(
  cartItems: CartItem[],
  paymentMode: PaymentMode
): Promise<CheckoutResult> {
  if (!supabase) {
    return { ok: false, message: "Supabase is not configured for checkout." };
  }

  if (cartItems.length === 0) {
    return { ok: false, message: "Cart is empty." };
  }

  const missingIds = cartItems.some((item) => !item.productId || !item.vendorId);

  if (missingIds) {
    return {
      ok: false,
      message: "Cart items need Supabase product IDs before checkout."
    };
  }

  const vendorIds = new Set(cartItems.map((item) => item.vendorId));

  if (vendorIds.size !== 1) {
    return {
      ok: false,
      message: "Checkout currently supports one merchant per order."
    };
  }

  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError) {
    return { ok: false, message: `Session lookup failed: ${userError.message}` };
  }

  if (!user) {
    return { ok: false, message: "Sign in with Google before checkout." };
  }

  const subtotalNaira = cartItems.reduce(
    (sum, item) => sum + item.quantity * item.unitPriceNaira,
    0
  );
  const totalNaira = subtotalNaira + deliveryFeeNaira;
  const merchantId = cartItems[0].vendorId!;
  const paymentReference = `CHOW-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  const paymentStatus = paymentMode === "Flutterwave" ? "pending" : "pay_on_delivery";

  const orderResult = await supabase
    .from("orders")
    .insert({
      customer_id: user.id,
      merchant_id: merchantId,
      status: "placed",
      fulfilment_mode: "trek_delivery",
      payment_mode: paymentMode === "Flutterwave" ? "flutterwave" : "pay_on_delivery",
      payment_reference: paymentReference,
      payment_status: paymentStatus,
      subtotal_naira: subtotalNaira,
      delivery_fee_naira: deliveryFeeNaira,
      total_naira: totalNaira
    })
    .select("id")
    .single();

  if (orderResult.error) {
    return { ok: false, message: `Checkout failed: ${orderResult.error.message}` };
  }

  const orderId = orderResult.data.id as string;
  const itemResult = await supabase.from("order_items").insert(
    cartItems.map((item) => ({
      order_id: orderId,
      product_id: item.productId!,
      quantity: item.quantity,
      unit_price_naira: item.unitPriceNaira
    }))
  );

  if (itemResult.error) {
    return { ok: false, message: `Order item creation failed: ${itemResult.error.message}` };
  }

  const deliveryResult = await supabase.from("deliveries").insert({
    order_id: orderId,
    agent_id: null,
    status: "placed"
  });

  if (deliveryResult.error) {
    return { ok: false, message: `Delivery request failed: ${deliveryResult.error.message}` };
  }

  const transactionResult = await supabase.from("transactions").insert({
    order_id: orderId,
    provider: paymentMode === "Flutterwave" ? "flutterwave" : "pay_on_delivery",
    provider_reference: paymentReference,
    amount_naira: totalNaira,
    status: paymentStatus
  });

  if (transactionResult.error) {
    return { ok: false, message: `Payment record failed: ${transactionResult.error.message}` };
  }

  const paymentUrl =
    paymentMode === "Flutterwave" && isFlutterwaveConfigured
      ? buildFlutterwaveUrl(paymentReference, totalNaira)
      : undefined;

  return {
    ok: true,
    message:
      paymentMode === "Flutterwave"
        ? paymentUrl
          ? `Order #${orderId.slice(0, 8).toUpperCase()} placed. Complete Flutterwave payment with reference ${paymentReference}.`
          : `Order #${orderId.slice(0, 8).toUpperCase()} placed as pending. Configure Flutterwave payment URL to collect online payment.`
        : `Order #${orderId.slice(0, 8).toUpperCase()} placed for pay on delivery.`,
    orderId,
    paymentUrl
  };
}

function buildFlutterwaveUrl(reference: string, amountNaira: number): string {
  const url = new URL(flutterwavePaymentUrl);
  url.searchParams.set("tx_ref", reference);
  url.searchParams.set("amount", String(amountNaira));
  url.searchParams.set("currency", "NGN");

  return url.toString();
}
