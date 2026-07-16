import {
  activeOrders,
  adminMetrics,
  agentOpportunities,
  cartItems,
  merchantMetrics,
  notificationPreferences,
  products,
  timelineEvents,
  vendors
} from "../data/mockData";
import { CommerceRepository } from "./types";

export const commerceRepository: CommerceRepository = {
  getHomeVendors: () => vendors,
  getTimeline: () => timelineEvents,
  getOrders: () => activeOrders,
  getCartItems: () => cartItems,
  getMerchantProducts: () => products,
  getMerchantMetrics: () => merchantMetrics,
  getAgentOpportunities: () => agentOpportunities,
  getNotificationPreferences: () => notificationPreferences,
  getAdminMetrics: () => adminMetrics
};
