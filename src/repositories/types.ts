import {
  AdminMetric,
  AgentOpportunity,
  CartItem,
  MerchantMetric,
  NotificationPreference,
  Order,
  Product,
  TimelineEvent,
  Vendor
} from "../types/domain";

export type CommerceRepository = {
  getHomeVendors: () => Vendor[];
  getTimeline: () => TimelineEvent[];
  getOrders: () => Order[];
  getCartItems: () => CartItem[];
  getMerchantProducts: () => Product[];
  getMerchantMetrics: () => MerchantMetric[];
  getAgentOpportunities: () => AgentOpportunity[];
  getNotificationPreferences: () => NotificationPreference[];
  getAdminMetrics: () => AdminMetric[];
};
