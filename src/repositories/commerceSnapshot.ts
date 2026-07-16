import {
  activeOrders,
  agentOpportunities,
  adminMetrics,
  cartItems,
  merchantMetrics,
  notificationPreferences,
  products,
  timelineEvents,
  vendors
} from "../data/mockData";
import { hasSupabaseConfig } from "../lib/supabase";
import {
  AgentOpportunity,
  CartItem,
  NotificationPreference,
  Order,
  Product,
  TimelineEvent,
  Vendor
} from "../types/domain";
import { loadSupabaseCommerceSnapshot } from "./supabaseCommerceRepository";

export type CommerceSnapshot = {
  vendors: Vendor[];
  products: Product[];
  orders: Order[];
  cartItems: CartItem[];
  timelineEvents: TimelineEvent[];
  notificationPreferences: NotificationPreference[];
  agentOpportunities: AgentOpportunity[];
  source: "mock" | "supabase";
  warning?: string;
};

export function getMockCommerceSnapshot(): CommerceSnapshot {
  return {
    vendors,
    products,
    orders: activeOrders,
    cartItems,
    timelineEvents,
    notificationPreferences,
    agentOpportunities,
    source: "mock"
  };
}

export async function loadCommerceSnapshot(): Promise<CommerceSnapshot> {
  const mockSnapshot = getMockCommerceSnapshot();

  if (!hasSupabaseConfig) {
    return {
      ...mockSnapshot,
      warning: "Supabase anon key is not configured; using mock data."
    };
  }

  try {
    const supabaseSnapshot = await loadSupabaseCommerceSnapshot();

    return {
      ...mockSnapshot,
      ...supabaseSnapshot,
      source: "supabase"
    };
  } catch (error) {
    return {
      ...mockSnapshot,
      warning: error instanceof Error ? error.message : "Supabase data load failed; using mock data."
    };
  }
}

export const staticMetrics = {
  merchantMetrics,
  adminMetrics
};
