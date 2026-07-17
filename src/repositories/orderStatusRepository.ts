import { supabase } from "../lib/supabase";
import { OrderStatus } from "../types/domain";

export type OrderStatusResult = {
  ok: boolean;
  message: string;
};

const orderStatusToDb: Record<OrderStatus, "preparing" | "ready" | "in_transit" | "arrived" | "delivered" | "cancelled"> = {
  Preparing: "preparing",
  Ready: "ready",
  "In Transit": "in_transit",
  Arrived: "arrived",
  Delivered: "delivered",
  Cancelled: "cancelled"
};

export async function updateMerchantOrderStatus(
  orderId: string,
  status: OrderStatus
): Promise<OrderStatusResult> {
  if (!supabase) {
    return { ok: false, message: "Supabase is not configured for order updates." };
  }

  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError) {
    return { ok: false, message: `Session lookup failed: ${userError.message}` };
  }

  if (!user) {
    return { ok: false, message: "Sign in with Google before updating orders." };
  }

  const result = await supabase
    .from("orders")
    .update({ status: orderStatusToDb[status] })
    .eq("id", orderId)
    .select("id")
    .maybeSingle();

  if (result.error) {
    return { ok: false, message: `Order update failed: ${result.error.message}` };
  }

  if (!result.data) {
    return {
      ok: false,
      message: "Order update was not allowed. This account may not own the merchant."
    };
  }

  return { ok: true, message: `Order marked ${status}.` };
}
