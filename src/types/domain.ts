import { Ionicons } from "@expo/vector-icons";

export type CustomerTabKey = "home" | "discover" | "community" | "orders" | "profile";
export type StaffTabKey = "merchant" | "agent" | "admin";
export type TabKey = CustomerTabKey | StaffTabKey;

export type FoodStatus = "Preparing" | "Food Ready" | "Sold Out";
export type OrderStatus = "Preparing" | "Ready" | "In Transit" | "Delivered" | "Cancelled";
export type FulfilmentMode = "Trek Delivery" | "Pickup" | "Express";
export type UserRole = "Customer" | "Merchant" | "Delivery Agent" | "Admin";

export type NavItem = {
  key: TabKey;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  prdFixed?: boolean;
};

export type Vendor = {
  id: string;
  name: string;
  category: string;
  distanceKm: number;
  rating: number;
  status: FoodStatus;
  followers: number;
  followed: boolean;
  color: string;
  etaMinutes: number;
  deliveryModes: FulfilmentMode[];
};

export type TimelineEvent = {
  id: string;
  vendor: string;
  title: string;
  body: string;
  status: FoodStatus;
  minutesAgo: number;
  type: "Food Ready" | "New Product" | "Special Offer" | "Community Post" | "Store Update";
};

export type Order = {
  id: string;
  recordId?: string;
  vendor: string;
  summary: string;
  status: OrderStatus;
  fulfilmentMode: FulfilmentMode;
  etaMinutes: number;
  totalNaira: number;
  paymentMode?: PaymentMode;
  paymentStatus?: "Pending" | "Authorized" | "Paid" | "Failed" | "Pay on Delivery";
  paymentReference?: string;
  receiptLines?: string[];
};

export type Product = {
  id: string;
  vendorId: string;
  name: string;
  priceNaira: number;
  status: FoodStatus;
  imageUrl?: string;
};

export type CartItem = {
  id: string;
  productId?: string;
  vendorId?: string;
  productName: string;
  vendorName: string;
  quantity: number;
  unitPriceNaira: number;
};

export type PaymentMode = "Flutterwave" | "Pay on Delivery";

export type MerchantMetric = {
  label: string;
  value: string;
  tone: "green" | "orange" | "neutral";
};

export type AgentOpportunity = {
  id: string;
  route: string;
  payoutNaira: number;
  distanceKm: number;
  eligibility: "Best fit" | "Nearby" | "Watch";
  stage?: "Open" | "Claimed" | "Picked Up" | "Delivered";
};

export type NotificationPreference = {
  id: string;
  label: string;
  enabled: boolean;
};

export type AdminMetric = {
  label: string;
  value: string;
  detail: string;
};
