import { supabase } from "../lib/supabase";
import { FoodStatus, NotificationPreference } from "../types/domain";

type SyncResult = {
  ok: true;
  message: string;
} | {
  ok: false;
  message: string;
};

const foodStatusToDb: Record<FoodStatus, "preparing" | "food_ready" | "sold_out"> = {
  Preparing: "preparing",
  "Food Ready": "food_ready",
  "Sold Out": "sold_out"
};

export async function syncVendorFollow(
  merchantId: string,
  shouldFollow: boolean
): Promise<SyncResult> {
  const user = await getCurrentUser();

  if (!user.ok) {
    return user;
  }

  const result = shouldFollow
    ? await supabase!
        .from("vendor_followers")
        .upsert({ customer_id: user.id, merchant_id: merchantId }, { onConflict: "customer_id,merchant_id" })
    : await supabase!
        .from("vendor_followers")
        .delete()
        .eq("customer_id", user.id)
        .eq("merchant_id", merchantId);

  if (result.error) {
    return formatFailure("Follow sync failed", result.error.message);
  }

  return {
    ok: true,
    message: shouldFollow ? "Follow synced to Supabase." : "Unfollow synced to Supabase."
  };
}

export async function syncNotificationPreference(
  preference: NotificationPreference
): Promise<SyncResult> {
  const user = await getCurrentUser();

  if (!user.ok) {
    return user;
  }

  const result = await supabase!
    .from("notification_preferences")
    .upsert(
      {
        user_id: user.id,
        category: preference.id,
        label: preference.label,
        enabled: preference.enabled
      },
      { onConflict: "user_id,category" }
    );

  if (result.error) {
    return formatFailure("Notification sync failed", result.error.message);
  }

  return { ok: true, message: "Notification preference synced to Supabase." };
}

export async function syncProductStatus(
  productId: string,
  status: FoodStatus
): Promise<SyncResult> {
  const user = await getCurrentUser();

  if (!user.ok) {
    return user;
  }

  const result = await supabase!
    .from("products")
    .update({ status: foodStatusToDb[status] })
    .eq("id", productId)
    .select("id")
    .maybeSingle();

  if (result.error) {
    return formatFailure("Product status sync failed", result.error.message);
  }

  if (!result.data) {
    return {
      ok: false,
      message: "Product status stayed local. This account is not the merchant owner for that product."
    };
  }

  return { ok: true, message: "Product status synced to Supabase." };
}

export async function syncAgentAvailability(isAvailable: boolean): Promise<SyncResult> {
  const agent = await getCurrentAgentProfileId();

  if (!agent.ok) {
    return agent;
  }

  const result = await supabase!
    .from("delivery_agent_profiles")
    .update({ is_available: isAvailable })
    .eq("id", agent.id)
    .select("id")
    .maybeSingle();

  if (result.error) {
    return formatFailure("Agent availability sync failed", result.error.message);
  }

  return {
    ok: true,
    message: isAvailable ? "Agent availability synced as ON." : "Agent availability synced as OFF."
  };
}

export async function syncDeliveryClaim(
  deliveryId: string,
  shouldClaim: boolean
): Promise<SyncResult> {
  const agent = await getCurrentAgentProfileId();

  if (!agent.ok) {
    return agent;
  }

  const result = shouldClaim
    ? await supabase!
        .from("deliveries")
        .update({ agent_id: agent.id, status: "accepted" })
        .eq("id", deliveryId)
        .is("agent_id", null)
        .select("id")
        .maybeSingle()
    : await supabase!
        .from("deliveries")
        .update({ agent_id: null, status: "placed" })
        .eq("id", deliveryId)
        .eq("agent_id", agent.id)
        .select("id")
        .maybeSingle();

  if (result.error) {
    return formatFailure("Delivery claim sync failed", result.error.message);
  }

  if (!result.data) {
    return {
      ok: false,
      message: "Delivery claim stayed local. It may already be assigned or unavailable to this agent."
    };
  }

  return {
    ok: true,
    message: shouldClaim ? "Delivery claim synced to Supabase." : "Delivery release synced to Supabase."
  };
}

export async function syncDeliveryStage(
  deliveryId: string,
  status: "in_transit" | "delivered"
): Promise<SyncResult> {
  const agent = await getCurrentAgentProfileId();

  if (!agent.ok) {
    return agent;
  }

  const result = await supabase!
    .from("deliveries")
    .update({ status, last_seen_at: new Date().toISOString() })
    .eq("id", deliveryId)
    .eq("agent_id", agent.id)
    .select("id")
    .maybeSingle();

  if (result.error) {
    return formatFailure("Delivery stage sync failed", result.error.message);
  }

  if (!result.data) {
    return {
      ok: false,
      message: "Delivery stage stayed local. This delivery is not assigned to this agent."
    };
  }

  return {
    ok: true,
    message:
      status === "in_transit"
        ? "Pickup stage synced to Supabase."
        : "Delivery completion synced to Supabase."
  };
}

type UserLookupResult = { ok: true; id: string } | { ok: false; message: string };

async function getCurrentUser(): Promise<UserLookupResult> {
  if (!supabase) {
    return { ok: false, message: "Saved locally. Supabase is not configured in this build." };
  }

  const { data, error } = await supabase.auth.getUser();

  if (error) {
    return formatFailure("Session lookup failed", error.message);
  }

  if (!data.user) {
    return {
      ok: false,
      message: "Saved locally. Sign in with Google to sync this change to Supabase."
    };
  }

  return { ok: true, id: data.user.id };
}

async function getCurrentAgentProfileId(): Promise<UserLookupResult> {
  const user = await getCurrentUser();

  if (!user.ok) {
    return user;
  }

  const result = await supabase!
    .from("delivery_agent_profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (result.error) {
    return formatFailure("Agent profile lookup failed", result.error.message);
  }

  if (!result.data) {
    return {
      ok: false,
      message: "Saved locally. This account does not have a delivery agent profile yet."
    };
  }

  return { ok: true, id: result.data.id };
}

function formatFailure(prefix: string, detail: string): { ok: false; message: string } {
  return {
    ok: false,
    message: `${prefix}: ${detail}`
  };
}
