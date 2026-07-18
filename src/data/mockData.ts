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

export const vendors: Vendor[] = [
  {
    id: "mama-put",
    name: "Mama Put's Kitchen",
    category: "Rice, stew, swallow",
    distanceKm: 0.8,
    rating: 4.8,
    status: "Food Ready",
    followers: 1240,
    followed: true,
    color: "#f97316",
    etaMinutes: 12,
    deliveryModes: ["Trek Delivery", "Pickup", "Express"]
  },
  {
    id: "suya-corner",
    name: "Suya Corner",
    category: "Grill and evening bites",
    distanceKm: 1.4,
    rating: 4.6,
    status: "Preparing",
    followers: 870,
    followed: false,
    color: "#064e3b",
    etaMinutes: 18,
    deliveryModes: ["Pickup", "Express"]
  },
  {
    id: "bisola-bakes",
    name: "Aunty Bisola Bakes",
    category: "Bread, pastries, snacks",
    distanceKm: 2.1,
    rating: 4.7,
    status: "Food Ready",
    followers: 520,
    followed: true,
    color: "#10b981",
    etaMinutes: 22,
    deliveryModes: ["Trek Delivery", "Pickup"]
  }
];

export const timelineEvents: TimelineEvent[] = [
  {
    id: "event-jollof-ready",
    vendor: "Mama Put's Kitchen",
    title: "Jollof rice is ready",
    body: "Fresh pot just opened. Pickup and Trek Delivery available.",
    status: "Food Ready",
    minutesAgo: 4,
    type: "Food Ready"
  },
  {
    id: "event-suya-prep",
    vendor: "Suya Corner",
    title: "Preparing evening batch",
    body: "Chicken and beef suya will be ready soon.",
    status: "Preparing",
    minutesAgo: 18,
    type: "Store Update"
  },
  {
    id: "event-rolls-new",
    vendor: "Aunty Bisola Bakes",
    title: "New coconut rolls",
    body: "Limited tray today with warm orange glaze.",
    status: "Food Ready",
    minutesAgo: 31,
    type: "New Product"
  }
];

export const activeOrders: Order[] = [
  {
    id: "42A",
    vendor: "Mama Put's Kitchen",
    summary: "Jollof rice, beef, plantain",
    status: "In Transit",
    fulfilmentMode: "Trek Delivery",
    etaMinutes: 12,
    totalNaira: 4200,
    paymentMode: "Pay with card",
    paymentStatus: "Authorized",
    paymentReference: "CHOW-DEMO-42A",
    receiptLines: ["Jollof rice + beef x1", "Delivery fee", "Card payment authorized"]
  },
  {
    id: "38C",
    vendor: "Aunty Bisola Bakes",
    summary: "Coconut rolls pack",
    status: "Ready",
    fulfilmentMode: "Pickup",
    etaMinutes: 6,
    totalNaira: 1800,
    paymentMode: "Pay on Delivery",
    paymentStatus: "Pay on Delivery",
    paymentReference: "POD-38C",
    receiptLines: ["Coconut rolls pack x1", "Pickup order", "Payment due at handoff"]
  }
];

export const cartItems: CartItem[] = [
  {
    id: "cart-jollof",
    productId: "66666666-6666-4666-8666-666666666661",
    vendorId: "55555555-5555-4555-8555-555555555551",
    productName: "Jollof rice + beef",
    vendorName: "Mama Put's Kitchen",
    quantity: 1,
    unitPriceNaira: 3200
  },
  {
    id: "cart-plantain",
    productId: "66666666-6666-4666-8666-666666666662",
    vendorId: "55555555-5555-4555-8555-555555555551",
    productName: "Fried plantain side",
    vendorName: "Mama Put's Kitchen",
    quantity: 1,
    unitPriceNaira: 900
  }
];

export const products: Product[] = [
  {
    id: "jollof-beef",
    vendorId: "mama-put",
    name: "Jollof rice + beef",
    priceNaira: 3200,
    status: "Food Ready",
    imageUrl: "https://images.unsplash.com/photo-1604329760661-e71dc83f8f26"
  },
  {
    id: "egusi-swallow",
    vendorId: "mama-put",
    name: "Egusi and swallow",
    priceNaira: 2800,
    status: "Preparing",
    imageUrl: "https://images.unsplash.com/photo-1547592180-85f173990554"
  },
  {
    id: "plantain-side",
    vendorId: "mama-put",
    name: "Fried plantain side",
    priceNaira: 900,
    status: "Food Ready",
    imageUrl: "https://images.unsplash.com/photo-1619929775482-5dd5083a0fd2"
  }
];

export const merchantMetrics: MerchantMetric[] = [
  { label: "Open orders", value: "8", tone: "orange" },
  { label: "Followers", value: "1,240", tone: "green" },
  { label: "Today sales", value: "NGN 86k", tone: "neutral" }
];

export const agentOpportunities: AgentOpportunity[] = [
  {
    id: "opp-42a",
    route: "Mama Put's Kitchen -> Admiralty Way",
    payoutNaira: 1200,
    distanceKm: 2.4,
    eligibility: "Best fit",
    stage: "Open"
  },
  {
    id: "opp-39b",
    route: "Suya Corner -> Fola Osibo",
    payoutNaira: 900,
    distanceKm: 1.8,
    eligibility: "Nearby",
    stage: "Open"
  }
];

export const notificationPreferences: NotificationPreference[] = [
  { id: "food-ready", label: "Food Ready", enabled: true },
  { id: "new-products", label: "New Products", enabled: true },
  { id: "special-offers", label: "Special Offers", enabled: true },
  { id: "community", label: "Community Updates", enabled: false },
  { id: "timeline", label: "Vendor Timeline Updates", enabled: true }
];

export const adminMetrics: AdminMetric[] = [
  { label: "Active merchants", value: "42", detail: "3 pending onboarding" },
  { label: "Open disputes", value: "5", detail: "2 need admin review" },
  { label: "Active agents", value: "18", detail: "12 currently available" }
];
