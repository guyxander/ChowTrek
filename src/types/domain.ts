import { Ionicons } from "@expo/vector-icons";

export type CustomerTabKey = "home" | "discover" | "community" | "orders" | "profile";
export type StaffTabKey = "merchant" | "agent" | "admin";
export type TabKey = CustomerTabKey | StaffTabKey;

export type FoodStatus = "Preparing" | "Food Ready" | "Sold Out";
export type OrderStatus = "Preparing" | "Ready" | "In Transit" | "Arrived" | "Delivered" | "Cancelled";
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

export type SavedAddress = {
  id: string;
  label: string;
  detail: string;
  area: string;
  distanceBiasKm: number;
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
  fulfilmentModes?: FulfilmentMode[];
  productName: string;
  vendorName: string;
  quantity: number;
  unitPriceNaira: number;
};

export type PaymentMode = "Pay with card" | "Pay on Delivery" | "Wallet";
export type WalletRole = "customer" | "merchant" | "agent" | "admin";
export type MerchantDashboardSection = "home" | "orders" | "products";
export type AgentDashboardSection = "home" | "orders" | "earnings";
export type AdminDashboardSection = "home" | "queue" | "audit";

export type WalletLedgerEntry = {
  id: string;
  label: string;
  amountNaira: number;
  direction: "credit" | "debit";
  status: "Pending" | "Available" | "Paid" | "Failed";
  createdAt: string;
};

export type WalletSummary = {
  role: WalletRole;
  availableBalanceNaira: number;
  pendingBalanceNaira: number;
  totalEarnedNaira: number;
  virtualAccount?: string;
  savedBank?: string;
  message: string;
  ledger: WalletLedgerEntry[];
};

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
  stage?: "Open" | "Claimed" | "Picked Up" | "Arrived" | "Delivered";
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

export type AdminQueueItem = {
  id: string;
  label: string;
  detail: string;
  state: "Open" | "Approved" | "Denied";
  kind: "merchant" | "agent" | "dispute" | "audit";
};
