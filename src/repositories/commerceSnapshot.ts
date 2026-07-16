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

const emptySnapshot: CommerceSnapshot = {
  vendors: [],
  products: [],
  orders: [],
  cartItems: [],
  timelineEvents: [],
  notificationPreferences: [],
  agentOpportunities: [],
  source: "supabase"
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

export function getInitialCommerceSnapshot(): CommerceSnapshot {
  return hasSupabaseConfig
    ? {
        ...emptySnapshot,
        warning: "Loading live ChowTrek data..."
      }
    : getMockCommerceSnapshot();
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
      ...emptySnapshot,
      ...supabaseSnapshot,
      cartItems: supabaseSnapshot.cartItems ?? [],
      notificationPreferences:
        supabaseSnapshot.notificationPreferences ?? mockSnapshot.notificationPreferences,
      source: "supabase",
      warning: "Connected to live ChowTrek data."
    };
  } catch (error) {
    return {
      ...emptySnapshot,
      notificationPreferences: mockSnapshot.notificationPreferences,
      warning:
        error instanceof Error
          ? `Live data unavailable: ${error.message}`
          : "Live data unavailable. Please try again."
    };
  }
}

export const staticMetrics = {
  merchantMetrics,
  adminMetrics
};
