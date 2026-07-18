import { supabase } from "../lib/supabase";
import {
  AgentOpportunity,
  NotificationPreference,
  Order,
  Product,
  TimelineEvent,
  Vendor
} from "../types/domain";
import type { CommerceSnapshot } from "./commerceSnapshot";

type MerchantRow = {
  id: string;
  business_name: string;
  description: string | null;
  neighborhood: string | null;
};

type ProductRow = {
  id: string;
  merchant_id: string;
  name: string;
  price_naira: number;
  status: "preparing" | "food_ready" | "sold_out";
  image_url: string | null;
  merchant_profiles?: MerchantRow | MerchantRow[] | null;
};

type TimelineRow = {
  id: string;
  title: string;
  body: string | null;
  type: "food_ready" | "new_product" | "special_offer" | "community_post" | "store_update" | "sold_out";
  created_at: string;
  merchant_profiles?: MerchantRow | MerchantRow[] | null;
};

type OrderRow = {
  id: string;
  status: "preparing" | "ready" | "in_transit" | "arrived" | "delivered" | "cancelled" | "placed" | "accepted" | "cart";
  fulfilment_mode: "pickup" | "trek_delivery" | "express";
  total_naira: number;
  payment_mode: "flutterwave" | "quickteller" | "pay_on_delivery" | "wallet";
  payment_status: "pending" | "authorized" | "paid" | "failed" | "pay_on_delivery";
  payment_reference: string | null;
  created_at: string;
  merchant_profiles?: MerchantRow | MerchantRow[] | null;
};

type DeliveryRow = {
  id: string;
  status: "preparing" | "ready" | "in_transit" | "arrived" | "delivered" | "cancelled" | "placed" | "accepted" | "cart";
  agent_id: string | null;
  orders?: OrderWithMerchantRow | OrderWithMerchantRow[] | null;
};

type FollowRow = {
  merchant_id: string;
};

type NotificationPreferenceRow = {
  category: string;
  label: string;
  enabled: boolean;
};

type OrderWithMerchantRow = {
  total_naira: number;
  fulfilment_mode: "pickup" | "trek_delivery" | "express";
  merchant_profiles?: MerchantRow | MerchantRow[] | null;
};

const foodStatusMap = {
  preparing: "Preparing",
  food_ready: "Food Ready",
  sold_out: "Sold Out"
} as const;

const orderStatusMap = {
  cart: "Preparing",
  placed: "Preparing",
  accepted: "Preparing",
  preparing: "Preparing",
  ready: "Ready",
  in_transit: "In Transit",
  arrived: "Arrived",
  delivered: "Delivered",
  cancelled: "Cancelled"
} as const;

const fulfilmentModeMap = {
  pickup: "Pickup",
  trek_delivery: "Trek Delivery",
  express: "Express"
} as const;

const paymentModeMap = {
  flutterwave: "Pay with card",
  quickteller: "Pay with card",
  pay_on_delivery: "Pay on Delivery",
  wallet: "Wallet"
} as const;

const paymentStatusMap = {
  pending: "Pending",
  authorized: "Authorized",
  paid: "Paid",
  failed: "Failed",
  pay_on_delivery: "Pay on Delivery"
} as const;

const timelineTypeMap = {
  food_ready: "Food Ready",
  new_product: "New Product",
  special_offer: "Special Offer",
  community_post: "Community Post",
  store_update: "Store Update",
  sold_out: "Store Update"
} as const;

export async function loadSupabaseCommerceSnapshot(): Promise<Partial<CommerceSnapshot>> {
  if (!supabase) {
    throw new Error("Supabase client is not configured.");
  }

  const userResult = await supabase.auth.getUser();
  const userId = userResult.data.user?.id;
  const [merchantResult, productResult, timelineResult] = await Promise.all([
    supabase.from("merchant_profiles").select("id,business_name,description,neighborhood").limit(20),
    supabase
      .from("products")
      .select("id,merchant_id,name,price_naira,status,image_url,merchant_profiles(id,business_name,description,neighborhood)")
      .limit(40),
    supabase
      .from("vendor_timeline_events")
      .select("id,title,body,type,created_at,merchant_profiles(id,business_name,description,neighborhood)")
      .order("created_at", { ascending: false })
      .limit(30)
  ]);

  const [orderResult, agentResult] = userId
    ? await Promise.all([
        supabase
          .from("orders")
          .select("id,status,fulfilment_mode,total_naira,payment_mode,payment_status,payment_reference,created_at,merchant_profiles(id,business_name,description,neighborhood)")
          .order("created_at", { ascending: false })
          .limit(20),
        supabase
          .from("deliveries")
          .select("id,status,agent_id,orders(total_naira,fulfilment_mode,merchant_profiles(id,business_name,description,neighborhood))")
          .in("status", ["placed", "accepted", "ready", "in_transit", "arrived"])
          .limit(10)
      ])
    : [
        { data: [], error: null },
        { data: [], error: null }
      ];

  const [followResult, notificationPreferenceResult] = await Promise.all([
    userId
      ? supabase.from("vendor_followers").select("merchant_id").eq("customer_id", userId)
      : Promise.resolve({ data: [], error: null }),
    userId
      ? supabase
          .from("notification_preferences")
          .select("category,label,enabled")
          .eq("user_id", userId)
      : Promise.resolve({ data: [], error: null })
  ]);

  const firstError =
    merchantResult.error ||
    productResult.error ||
    timelineResult.error ||
    orderResult.error ||
    agentResult.error ||
    followResult.error ||
    notificationPreferenceResult.error;

  if (firstError) {
    throw new Error(firstError.message);
  }

  const merchants = (merchantResult.data ?? []) as MerchantRow[];
  const productRows = (productResult.data ?? []) as unknown as ProductRow[];
  const timelineRows = (timelineResult.data ?? []) as unknown as TimelineRow[];
  const orderRows = (orderResult.data ?? []) as unknown as OrderRow[];
  const deliveryRows = (agentResult.data ?? []) as unknown as DeliveryRow[];
  const followRows = (followResult.data ?? []) as FollowRow[];
  const notificationPreferenceRows = (notificationPreferenceResult.data ??
    []) as NotificationPreferenceRow[];
  const followedMerchantIds = new Set(followRows.map((follow) => follow.merchant_id));

  const snapshot: Partial<CommerceSnapshot> = {
    vendors: merchants.map((merchant, index) =>
      mapMerchantToVendor(merchant, index, followedMerchantIds.has(merchant.id))
    ),
    products: productRows.map(mapProduct),
    timelineEvents: timelineRows.map(mapTimelineEvent),
    orders: orderRows.map(mapOrder),
    agentOpportunities: deliveryRows.map(mapDeliveryOpportunity)
  };

  if (notificationPreferenceRows.length > 0) {
    snapshot.notificationPreferences = notificationPreferenceRows.map(mapNotificationPreference);
  }

  return snapshot;
}

function mapMerchantToVendor(row: MerchantRow, index: number, followed: boolean): Vendor {
  return {
    id: row.id,
    name: row.business_name,
    category: row.description ?? row.neighborhood ?? "Local vendor",
    distanceKm: 0.8 + index * 0.4,
    rating: 4.5,
    status: "Food Ready",
    followers: followed ? 1 : 0,
    followed,
    color: index % 2 === 0 ? "#f97316" : "#064e3b",
    etaMinutes: 12 + index * 4,
    deliveryModes: ["Trek Delivery", "Pickup", "Express"]
  };
}

function mapProduct(row: ProductRow): Product {
  return {
    id: row.id,
    vendorId: row.merchant_id,
    name: row.name,
    priceNaira: row.price_naira,
    status: foodStatusMap[row.status],
    imageUrl: row.image_url ?? undefined
  };
}

function mapTimelineEvent(row: TimelineRow): TimelineEvent {
  return {
    id: row.id,
    vendor: getMerchant(row.merchant_profiles)?.business_name ?? "Local vendor",
    title: row.title,
    body: row.body ?? "",
    status: row.type === "sold_out" ? "Sold Out" : row.type === "food_ready" ? "Food Ready" : "Preparing",
    minutesAgo: minutesSince(row.created_at),
    type: timelineTypeMap[row.type]
  };
}

function mapOrder(row: OrderRow): Order {
  return {
    id: row.id.slice(0, 8).toUpperCase(),
    recordId: row.id,
    vendor: getMerchant(row.merchant_profiles)?.business_name ?? "Local vendor",
    summary: `${fulfilmentModeMap[row.fulfilment_mode]} order`,
    status: orderStatusMap[row.status],
    fulfilmentMode: fulfilmentModeMap[row.fulfilment_mode],
    etaMinutes: 15,
    totalNaira: row.total_naira,
    paymentMode: paymentModeMap[row.payment_mode],
    paymentStatus: paymentStatusMap[row.payment_status],
    paymentReference: row.payment_reference ?? undefined,
    receiptLines: [
      `${fulfilmentModeMap[row.fulfilment_mode]} order`,
      `${paymentModeMap[row.payment_mode]} - ${paymentStatusMap[row.payment_status]}`,
      `Placed ${minutesSince(row.created_at)} min ago`
    ]
  };
}

function getMerchant(value: MerchantRow | MerchantRow[] | null | undefined): MerchantRow | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

function mapDeliveryOpportunity(row: DeliveryRow, index: number): AgentOpportunity {
  const order = getOrder(row.orders);
  const merchant = getMerchant(order?.merchant_profiles);
  const mode = order ? fulfilmentModeMap[order.fulfilment_mode] : "Trek Delivery";

  return {
    id: row.id,
    route: `${merchant?.business_name ?? "Merchant"} -> Customer (${mode})`,
    payoutNaira: Math.max(700, Math.round((order?.total_naira ?? 6000) * 0.12)),
    distanceKm: 1.6 + index * 0.5,
    eligibility: row.agent_id ? "Watch" : index === 0 ? "Best fit" : "Nearby",
    stage: mapDeliveryStage(row.status)
  };
}

function mapDeliveryStage(status: DeliveryRow["status"]): AgentOpportunity["stage"] {
  if (status === "delivered") {
    return "Delivered";
  }

  if (status === "arrived") {
    return "Arrived";
  }

  if (status === "in_transit") {
    return "Picked Up";
  }

  if (status === "accepted" || status === "ready") {
    return "Claimed";
  }

  return "Open";
}

function mapNotificationPreference(row: NotificationPreferenceRow): NotificationPreference {
  return {
    id: row.category,
    label: row.label,
    enabled: row.enabled
  };
}

function getOrder(
  value: OrderWithMerchantRow | OrderWithMerchantRow[] | null | undefined
): OrderWithMerchantRow | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

function minutesSince(timestamp: string): number {
  const created = new Date(timestamp).getTime();
  const diff = Date.now() - created;

  if (!Number.isFinite(diff) || diff < 0) {
    return 0;
  }

  return Math.max(0, Math.round(diff / 60000));
}
