import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";

import { BottomNav } from "./src/components/BottomNav";
import { AgentScreen } from "./src/screens/AgentScreen";
import { AdminScreen } from "./src/screens/AdminScreen";
import { CommunityScreen } from "./src/screens/CommunityScreen";
import { DiscoverScreen } from "./src/screens/DiscoverScreen";
import { HomeScreen } from "./src/screens/HomeScreen";
import { MerchantScreen } from "./src/screens/MerchantScreen";
import { OrdersScreen } from "./src/screens/OrdersScreen";
import { ProfileScreen } from "./src/screens/ProfileScreen";
import { createCheckoutOrder } from "./src/repositories/checkoutRepository";
import { getMockCommerceSnapshot, loadCommerceSnapshot } from "./src/repositories/commerceSnapshot";
import { createMerchantProduct } from "./src/repositories/merchantProductRepository";
import {
  syncAgentAvailability,
  syncDeliveryClaim,
  syncNotificationPreference,
  syncProductStatus,
  syncVendorFollow
} from "./src/repositories/supabaseMutationRepository";
import { subscribeToCommerceChanges } from "./src/repositories/supabaseRealtimeRepository";
import { colors } from "./src/theme/colors";
import {
  AgentOpportunity,
  CartItem,
  FoodStatus,
  NotificationPreference,
  Order,
  PaymentMode,
  Product,
  TabKey,
  TimelineEvent,
  Vendor
} from "./src/types/domain";

export default function App() {
  const initialSnapshot = getMockCommerceSnapshot();
  const [activeTab, setActiveTab] = useState<TabKey>("home");
  const [vendors, setVendors] = useState<Vendor[]>(initialSnapshot.vendors);
  const [cartItems, setCartItems] = useState<CartItem[]>(initialSnapshot.cartItems);
  const [merchantProducts, setMerchantProducts] = useState<Product[]>(initialSnapshot.products);
  const [orders, setOrders] = useState<Order[]>(initialSnapshot.orders);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>(
    initialSnapshot.timelineEvents
  );
  const [agentOpportunities, setAgentOpportunities] = useState<AgentOpportunity[]>(
    initialSnapshot.agentOpportunities
  );
  const [notificationPreferences, setNotificationPreferences] = useState<NotificationPreference[]>(
    initialSnapshot.notificationPreferences
  );
  const [dataNotice, setDataNotice] = useState(initialSnapshot.warning ?? "Loading ChowTrek data...");
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("Flutterwave");
  const [isAgentAvailable, setIsAgentAvailable] = useState(true);
  const [claimedOpportunityIds, setClaimedOpportunityIds] = useState<string[]>([]);

  useEffect(() => {
    let isMounted = true;
    let refreshTimeout: ReturnType<typeof setTimeout> | undefined;

    const applySnapshot = () => {
      loadCommerceSnapshot().then((snapshot) => {
        if (!isMounted) {
          return;
        }

        setVendors(snapshot.vendors);
        setCartItems(snapshot.cartItems);
        setMerchantProducts(snapshot.products);
        setOrders(snapshot.orders);
        setTimelineEvents(snapshot.timelineEvents);
        setNotificationPreferences(snapshot.notificationPreferences);
        setAgentOpportunities(snapshot.agentOpportunities);
        setDataNotice(
          snapshot.warning ??
            (snapshot.source === "supabase" ? "Connected to Supabase data." : "Using mock data.")
        );
      });
    };

    const refreshFromRealtime = () => {
      if (!isMounted) {
        return;
      }

      if (refreshTimeout) {
        clearTimeout(refreshTimeout);
      }

      refreshTimeout = setTimeout(() => {
        applySnapshot();
        setDataNotice("Live Supabase update received.");
      }, 500);
    };

    applySnapshot();
    const unsubscribe = subscribeToCommerceChanges(refreshFromRealtime);

    return () => {
      isMounted = false;
      if (refreshTimeout) {
        clearTimeout(refreshTimeout);
      }
      unsubscribe();
    };
  }, []);

  async function toggleVendorFollow(vendorId: string) {
    const vendor = vendors.find((currentVendor) => currentVendor.id === vendorId);
    const shouldFollow = !vendor?.followed;

    setVendors((currentVendors) =>
      currentVendors.map((vendor) =>
        vendor.id === vendorId
          ? {
              ...vendor,
              followed: !vendor.followed,
              followers: vendor.followed ? vendor.followers - 1 : vendor.followers + 1
            }
          : vendor
      )
    );

    const result = await syncVendorFollow(vendorId, shouldFollow);
    setDataNotice(result.message);
  }

  async function toggleNotificationPreference(preferenceId: string) {
    const nextPreference = notificationPreferences.find(
      (preference) => preference.id === preferenceId
    );

    if (!nextPreference) {
      return;
    }

    const updatedPreference = {
      ...nextPreference,
      enabled: !nextPreference.enabled
    };

    setNotificationPreferences((currentPreferences) =>
      currentPreferences.map((preference) =>
        preference.id === preferenceId
          ? { ...preference, enabled: !preference.enabled }
          : preference
      )
    );

    const result = await syncNotificationPreference(updatedPreference);
    setDataNotice(result.message);
  }

  function changeCartQuantity(itemId: string, delta: number) {
    setCartItems((currentItems) =>
      currentItems
        .map((item) =>
          item.id === itemId ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item
        )
        .filter((item) => item.quantity > 0)
    );
  }

  async function checkoutCart() {
    const result = await createCheckoutOrder(cartItems, paymentMode);

    setDataNotice(result.message);

    if (result.ok) {
      setCartItems([]);
      const snapshot = await loadCommerceSnapshot();
      setOrders(snapshot.orders);
      setAgentOpportunities(snapshot.agentOpportunities);
    }
  }

  async function addMerchantProduct(name: string, priceNaira: number) {
    const result = await createMerchantProduct(name, priceNaira);

    setDataNotice(result.message);

    if (result.ok) {
      const snapshot = await loadCommerceSnapshot();
      setMerchantProducts(snapshot.products);
      setTimelineEvents(snapshot.timelineEvents);
      setVendors(snapshot.vendors);
    }
  }

  async function cycleProductStatus(productId: string) {
    const nextStatus: Record<FoodStatus, FoodStatus> = {
      Preparing: "Food Ready",
      "Food Ready": "Sold Out",
      "Sold Out": "Preparing"
    };
    const product = merchantProducts.find((currentProduct) => currentProduct.id === productId);
    const status = product ? nextStatus[product.status] : "Preparing";

    setMerchantProducts((currentProducts) =>
      currentProducts.map((product) =>
        product.id === productId ? { ...product, status } : product
      )
    );

    const result = await syncProductStatus(productId, status);
    setDataNotice(result.message);
  }

  async function toggleOpportunityClaim(opportunityId: string) {
    const shouldClaim = !claimedOpportunityIds.includes(opportunityId);

    setClaimedOpportunityIds((currentIds) =>
      currentIds.includes(opportunityId)
        ? currentIds.filter((id) => id !== opportunityId)
        : [...currentIds, opportunityId]
    );

    const result = await syncDeliveryClaim(opportunityId, shouldClaim);
    setDataNotice(result.message);
  }

  async function toggleAgentAvailability() {
    const nextAvailability = !isAgentAvailable;

    setIsAgentAvailable(nextAvailability);
    const result = await syncAgentAvailability(nextAvailability);
    setDataNotice(result.message);
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.app}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.dataNotice}>{dataNotice}</Text>
          {activeTab === "home" ? (
            <HomeScreen onToggleFollow={toggleVendorFollow} vendors={vendors} />
          ) : null}
          {activeTab === "discover" ? (
            <DiscoverScreen
              onToggleFollow={toggleVendorFollow}
              timelineEvents={timelineEvents}
              vendors={vendors}
            />
          ) : null}
          {activeTab === "community" ? <CommunityScreen timelineEvents={timelineEvents} /> : null}
          {activeTab === "orders" ? (
            <OrdersScreen
              cartItems={cartItems}
              onCartQuantityChange={changeCartQuantity}
              onCheckout={checkoutCart}
              orders={orders}
              paymentMode={paymentMode}
              onPaymentModeChange={setPaymentMode}
            />
          ) : null}
          {activeTab === "profile" ? (
            <ProfileScreen
              notificationPreferences={notificationPreferences}
              onOpenRole={setActiveTab}
              onToggleNotification={toggleNotificationPreference}
            />
          ) : null}
          {activeTab === "merchant" ? (
            <MerchantScreen
              onCreateProduct={addMerchantProduct}
              onBack={() => setActiveTab("profile")}
              onCycleProductStatus={cycleProductStatus}
              orders={orders}
              products={merchantProducts}
            />
          ) : null}
          {activeTab === "agent" ? (
            <AgentScreen
              agentOpportunities={agentOpportunities}
              claimedOpportunityIds={claimedOpportunityIds}
              isAvailable={isAgentAvailable}
              onBack={() => setActiveTab("profile")}
              onToggleAvailability={toggleAgentAvailability}
              onToggleOpportunityClaim={toggleOpportunityClaim}
            />
          ) : null}
          {activeTab === "admin" ? <AdminScreen onBack={() => setActiveTab("profile")} /> : null}
        </ScrollView>
        <BottomNav activeTab={activeTab} onChange={setActiveTab} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  app: {
    backgroundColor: colors.surface,
    flex: 1
  },
  content: {
    padding: 16,
    paddingBottom: 104
  },
  dataNotice: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 12
  },
  safeArea: {
    backgroundColor: colors.surface,
    flex: 1
  }
});
