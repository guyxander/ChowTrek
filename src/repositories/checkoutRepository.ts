import { supabase } from "../lib/supabase";
import {
  isMonnifyConfigured,
  monnifyApiKey,
  monnifyCheckoutInitUrl,
  monnifyContractCode,
  monnifyMode
} from "../lib/productionConfig";
import { CartItem, FulfilmentMode, PaymentMode } from "../types/domain";
import {
  requireBuyerCanCheckout,
  requireMerchantCanReceiveOrderForMerchantId
} from "./profileCompletionRepository";

export type CheckoutResult = {
  ok: boolean;
  message: string;
  orderId?: string;
  paymentUrl?: string;
};

const fulfilmentConfig: Record<
  FulfilmentMode,
  { feeNaira: number; normalizedMode: "pickup" | "trek_delivery" | "express"; needsDeliveryRequest: boolean }
> = {
  "Trek Delivery": { feeNaira: 700, normalizedMode: "trek_delivery", needsDeliveryRequest: true },
  Pickup: { feeNaira: 0, normalizedMode: "pickup", needsDeliveryRequest: false },
  Express: { feeNaira: 1200, normalizedMode: "express", needsDeliveryRequest: true }
};

export async function createCheckoutOrder(
  cartItems: CartItem[],
  paymentMode: PaymentMode,
  fulfilmentMode: FulfilmentMode
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

  if (paymentMode === "Pay with card" && !isMonnifyConfigured) {
    return {
      ok: false,
      message: "Card payment is not configured in this APK yet. Rebuild the APK with Monnify API key and contract code."
    };
  }

  const buyerCompletion = await requireBuyerCanCheckout();

  if (!buyerCompletion.ok) {
    return buyerCompletion;
  }

  const subtotalNaira = cartItems.reduce(
    (sum, item) => sum + item.quantity * item.unitPriceNaira,
    0
  );
  const fulfilment = fulfilmentConfig[fulfilmentMode];
  const totalNaira = subtotalNaira + fulfilment.feeNaira;
  const merchantId = cartItems[0].vendorId!;

  const merchantCompletion = await requireMerchantCanReceiveOrderForMerchantId(merchantId);

  if (!merchantCompletion.ok) {
    return merchantCompletion;
  }

  const paymentReference = `CHOW-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  const normalizedPaymentMode =
    paymentMode === "Pay with card"
      ? "monnify"
      : paymentMode === "Wallet"
        ? "wallet"
        : "pay_on_delivery";
  const paymentStatus =
    paymentMode === "Pay with card" ? "pending" : paymentMode === "Wallet" ? "pending" : "pay_on_delivery";

  if (paymentMode === "Wallet") {
    const walletResult = await supabase
      .from("wallets")
      .select("available_balance_naira")
      .eq("user_id", user.id)
      .eq("role", "customer")
      .maybeSingle();

    if (walletResult.error) {
      return {
        ok: false,
        message: `Wallet checkout needs the Supabase wallet patch: ${walletResult.error.message}`
      };
    }

    const balance = Number(walletResult.data?.available_balance_naira ?? 0);

    if (balance < totalNaira) {
      return {
        ok: false,
        message: `Wallet balance is ${formatInlineNaira(balance)}. Add money or choose another payment method.`
      };
    }
  }

  const orderResult = await supabase
    .from("orders")
    .insert({
      customer_id: user.id,
      merchant_id: merchantId,
      status: "placed",
      fulfilment_mode: fulfilment.normalizedMode,
      payment_mode: normalizedPaymentMode,
      payment_reference: paymentReference,
      payment_status: paymentStatus,
      subtotal_naira: subtotalNaira,
      delivery_fee_naira: fulfilment.feeNaira,
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

  if (fulfilment.needsDeliveryRequest) {
    const deliveryResult = await supabase.from("deliveries").insert({
      order_id: orderId,
      agent_id: null,
      status: "placed"
    });

    if (deliveryResult.error) {
      return { ok: false, message: `Delivery request failed: ${deliveryResult.error.message}` };
    }
  }

  const transactionResult = await supabase.from("transactions").insert({
    order_id: orderId,
    provider: normalizedPaymentMode,
    provider_reference: paymentReference,
    amount_naira: totalNaira,
    status: paymentStatus
  });

  if (transactionResult.error) {
    return { ok: false, message: `Payment record failed: ${transactionResult.error.message}` };
  }

  if (paymentMode === "Wallet") {
    const walletDebitResult = await supabase.rpc("pay_order_with_wallet", {
      target_order_id: orderId
    });

    if (walletDebitResult.error) {
      return {
        ok: false,
        message: `Wallet debit failed: ${walletDebitResult.error.message}. Your cart was not cleared.`
      };
    }
  }

  const paymentUrl =
    paymentMode === "Pay with card" && isMonnifyConfigured
      ? buildMonnifyCheckoutUrl(paymentReference, totalNaira, orderId, user.email ?? "customer@chowtrek.app")
      : undefined;

  return {
    ok: true,
    message:
      paymentMode === "Pay with card"
        ? paymentUrl
          ? `Order #${orderId.slice(0, 8).toUpperCase()} placed. Complete card payment with reference ${paymentReference}.`
          : `Order #${orderId.slice(0, 8).toUpperCase()} placed as pending. Add card payment test credentials to collect card payments.`
        : paymentMode === "Wallet"
          ? `Order #${orderId.slice(0, 8).toUpperCase()} paid from ChowTrek Wallet for ${fulfilmentMode}.`
          : `Order #${orderId.slice(0, 8).toUpperCase()} placed for ${fulfilmentMode.toLowerCase()} with pay on delivery.`,
    orderId,
    paymentUrl
  };
}

function formatInlineNaira(amountNaira: number): string {
  return `₦${amountNaira.toLocaleString("en-NG")}`;
}

function buildMonnifyCheckoutUrl(reference: string, amountNaira: number, orderId: string, customerEmail: string): string {
  const url = new URL(monnifyCheckoutInitUrl);
  url.searchParams.set("mode", monnifyMode);
  url.searchParams.set("apiKey", monnifyApiKey);
  url.searchParams.set("contractCode", monnifyContractCode);
  url.searchParams.set("paymentReference", reference);
  url.searchParams.set("amount", String(amountNaira));
  url.searchParams.set("currencyCode", "NGN");
  url.searchParams.set("customerEmail", customerEmail);
  url.searchParams.set("customerName", "ChowTrek Customer");
  url.searchParams.set("paymentDescription", "ChowTrek order");
  url.searchParams.set("purpose", "order");
  url.searchParams.set("orderId", orderId);

  return url.toString();
}
