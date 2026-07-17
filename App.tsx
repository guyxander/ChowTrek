import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { Linking, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";

import { BottomNav } from "./src/components/BottomNav";
import { RoleDashboardNav } from "./src/components/RoleDashboardNav";
import { AgentScreen } from "./src/screens/AgentScreen";
import { AdminScreen } from "./src/screens/AdminScreen";
import { CommunityScreen } from "./src/screens/CommunityScreen";
import { DiscoverScreen } from "./src/screens/DiscoverScreen";
import { HomeScreen } from "./src/screens/HomeScreen";
import { MerchantScreen } from "./src/screens/MerchantScreen";
import { OrdersScreen } from "./src/screens/OrdersScreen";
import { ProfileScreen } from "./src/screens/ProfileScreen";
import { WalletScreen } from "./src/screens/WalletScreen";
import { createCheckoutOrder } from "./src/repositories/checkoutRepository";
import { getInitialCommerceSnapshot, loadCommerceSnapshot } from "./src/repositories/commerceSnapshot";
import {
  createMerchantProduct,
  updateMerchantStorefront
} from "./src/repositories/merchantProductRepository";
import { updateMerchantOrderStatus } from "./src/repositories/orderStatusRepository";
import { loadWalletSummary, requestWalletWithdrawal } from "./src/repositories/walletRepository";
import {
  syncAgentAvailability,
  syncDeliveryClaim,
  syncDeliveryStage,
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
  OrderStatus,
  PaymentMode,
  Product,
  TabKey,
  TimelineEvent,
  Vendor,
  WalletRole,
  WalletSummary
} from "./src/types/domain";

const initialWallets: Record<WalletRole, WalletSummary> = {
  customer: createInitialWallet("customer"),
  merchant: createInitialWallet("merchant"),
  agent: createInitialWallet("agent"),
  admin: createInitialWallet("admin")
};

export default function App() {
  const initialSnapshot = getInitialCommerceSnapshot();
  const [activeTab, setActiveTab] = useState<TabKey>("home");
  const [profilePanel, setProfilePanel] = useState<"profile" | "wallet">("profile");
  const isRoleDashboard =
    activeTab === "merchant" || activeTab === "agent" || activeTab === "admin";
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
  const [wallets, setWallets] = useState<Record<WalletRole, WalletSummary>>(initialWallets);
  const [isAgentAvailable, setIsAgentAvailable] = useState(true);
  const [claimedOpportunityIds, setClaimedOpportunityIds] = useState<string[]>([]);
  const [pickedUpOpportunityIds, setPickedUpOpportunityIds] = useState<string[]>([]);
  const [deliveredOpportunityIds, setDeliveredOpportunityIds] = useState<string[]>([]);

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
            (snapshot.source === "supabase"
              ? "Connected to live ChowTrek data."
              : "Using local demo data.")
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
    refreshWallets();
    const unsubscribe = subscribeToCommerceChanges(refreshFromRealtime, (message) => {
      if (isMounted) {
        setDataNotice(message);
      }
    });

    return () => {
      isMounted = false;
      if (refreshTimeout) {
        clearTimeout(refreshTimeout);
      }
      unsubscribe();
    };
  }, []);

  async function refreshWallets() {
    const [customer, merchant, agent, admin] = await Promise.all([
      loadWalletSummary("customer"),
      loadWalletSummary("merchant"),
      loadWalletSummary("agent"),
      loadWalletSummary("admin")
    ]);

    setWallets({ customer, merchant, agent, admin });
  }

  async function withdrawFromWallet(role: WalletRole, amountNaira: number) {
    const result = await requestWalletWithdrawal(role, amountNaira);
    setDataNotice(result.message);

    if (result.ok) {
      await refreshWallets();
    }
  }

  function openWalletTopUpNotice() {
    setDataNotice("Wallet top-up needs a funding provider before live deposits can be collected.");
  }

  function openCustomerWallet() {
    setProfilePanel("wallet");
    setActiveTab("profile");
  }

  function changeActiveTab(tab: TabKey) {
    if (tab !== "profile") {
      setProfilePanel("profile");
    }

    setActiveTab(tab);
  }

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

  function addProductToCart(product: Product, vendor: Vendor) {
    setCartItems((currentItems) => {
      const existingItem = currentItems.find((item) => item.productId === product.id);

      if (existingItem) {
        return currentItems.map((item) =>
          item.id === existingItem.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }

      return [
        ...currentItems,
        {
          id: `cart-${product.id}`,
          productId: product.id,
          vendorId: vendor.id,
          productName: product.name,
          vendorName: vendor.name,
          quantity: 1,
          unitPriceNaira: product.priceNaira
        }
      ];
    });
    setDataNotice(`${product.name} added to your ${vendor.name} cart.`);
  }

  async function checkoutCart(selectedItems = cartItems) {
    const result = await createCheckoutOrder(selectedItems, paymentMode);

    setDataNotice(result.message);

    if (result.ok) {
      const checkedOutItemIds = new Set(selectedItems.map((item) => item.id));
      setCartItems((currentItems) => currentItems.filter((item) => !checkedOutItemIds.has(item.id)));
      if (result.paymentUrl) {
        await Linking.openURL(result.paymentUrl);
      }
      const snapshot = await loadCommerceSnapshot();
      setOrders(snapshot.orders);
      setAgentOpportunities(snapshot.agentOpportunities);
      await refreshWallets();
    }
  }

  async function addMerchantProduct(name: string, priceNaira: number, imageUrl?: string) {
    const result = await createMerchantProduct(name, priceNaira, imageUrl);

    setDataNotice(result.message);

    if (result.ok) {
      const snapshot = await loadCommerceSnapshot();
      setMerchantProducts(snapshot.products);
      setTimelineEvents(snapshot.timelineEvents);
      setVendors(snapshot.vendors);
    }
  }

  async function saveMerchantStorefront(storeName: string, storeArea: string) {
    const result = await updateMerchantStorefront(storeName, storeArea);

    setDataNotice(result.message);

    if (result.ok) {
      const snapshot = await loadCommerceSnapshot();
      setVendors(snapshot.vendors);
      setMerchantProducts(snapshot.products);
    }
  }

  async function changeMerchantOrderStatus(orderId: string | undefined, status: OrderStatus) {
    if (!orderId) {
      setDataNotice("This order is local-only and cannot be updated in Supabase.");
      return;
    }

    const result = await updateMerchantOrderStatus(orderId, status);

    setDataNotice(result.message);

    if (result.ok) {
      const snapshot = await loadCommerceSnapshot();
      setOrders(snapshot.orders);
      setAgentOpportunities(snapshot.agentOpportunities);
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

    if (!shouldClaim) {
      setPickedUpOpportunityIds((currentIds) => currentIds.filter((id) => id !== opportunityId));
      setDeliveredOpportunityIds((currentIds) => currentIds.filter((id) => id !== opportunityId));
    }

    const result = await syncDeliveryClaim(opportunityId, shouldClaim);
    setDataNotice(result.message);
  }

  async function markOpportunityPickedUp(opportunityId: string) {
    if (!claimedOpportunityIds.includes(opportunityId)) {
      setDataNotice("Claim this delivery before marking pickup.");
      return;
    }

    setPickedUpOpportunityIds((currentIds) =>
      currentIds.includes(opportunityId) ? currentIds : [...currentIds, opportunityId]
    );
    const result = await syncDeliveryStage(opportunityId, "in_transit");
    setDataNotice(result.message);
  }

  async function markOpportunityDelivered(opportunityId: string) {
    if (!pickedUpOpportunityIds.includes(opportunityId)) {
      setDataNotice("Mark pickup before completing delivery.");
      return;
    }

    setDeliveredOpportunityIds((currentIds) =>
      currentIds.includes(opportunityId) ? currentIds : [...currentIds, opportunityId]
    );
    const result = await syncDeliveryStage(opportunityId, "delivered");
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
        {activeTab === "home" ? (
          <View style={[styles.content, styles.fixedCustomerContent]}>
            <HomeScreen
              cartItems={cartItems}
              dataNotice={dataNotice}
              onAddToCart={addProductToCart}
              onCartQuantityChange={changeCartQuantity}
              onOpenCart={() => changeActiveTab("orders")}
              onShowNotice={setDataNotice}
              onToggleFollow={toggleVendorFollow}
              products={merchantProducts}
              vendors={vendors}
            />
          </View>
        ) : activeTab === "discover" ? (
          <View style={[styles.content, styles.fixedCustomerContent]}>
            <DiscoverScreen
              cartItems={cartItems}
              dataNotice={dataNotice}
              onAddToCart={addProductToCart}
              onCartQuantityChange={changeCartQuantity}
              onOpenCart={() => changeActiveTab("orders")}
              onToggleFollow={toggleVendorFollow}
              products={merchantProducts}
              timelineEvents={timelineEvents}
              vendors={vendors}
            />
          </View>
        ) : activeTab === "orders" ? (
          <View style={[styles.content, styles.ordersContent]}>
            <OrdersScreen
              cartItems={cartItems}
              dataNotice={dataNotice}
              onCartQuantityChange={changeCartQuantity}
              onCheckout={checkoutCart}
              onOpenWallet={openCustomerWallet}
              orders={orders}
              paymentMode={paymentMode}
              onPaymentModeChange={setPaymentMode}
              onWalletRefresh={refreshWallets}
              wallet={wallets.customer}
            />
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={[
              styles.content,
              isRoleDashboard ? styles.roleDashboardContent : null
            ]}
          >
            {!isRoleDashboard ? <Text style={styles.dataNotice}>{dataNotice}</Text> : null}
            {activeTab === "community" ? <CommunityScreen timelineEvents={timelineEvents} /> : null}
            {activeTab === "profile" && profilePanel === "profile" ? (
              <ProfileScreen
                notificationPreferences={notificationPreferences}
                onOpenRole={changeActiveTab}
                onOpenWallet={openCustomerWallet}
                onToggleNotification={toggleNotificationPreference}
                wallet={wallets.customer}
              />
            ) : null}
            {activeTab === "profile" && profilePanel === "wallet" ? (
              <WalletScreen
                onAddMoney={openWalletTopUpNotice}
                onBack={() => setProfilePanel("profile")}
                onRefresh={refreshWallets}
                wallet={wallets.customer}
              />
            ) : null}
            {activeTab === "merchant" ? (
              <MerchantScreen
                onCreateProduct={addMerchantProduct}
                onBack={() => changeActiveTab("profile")}
                onCycleProductStatus={cycleProductStatus}
                onSaveStorefront={saveMerchantStorefront}
                onUpdateOrderStatus={changeMerchantOrderStatus}
                onWalletRefresh={refreshWallets}
                onWalletWithdraw={(amountNaira) => withdrawFromWallet("merchant", amountNaira)}
                orders={orders}
                products={merchantProducts}
                wallet={wallets.merchant}
              />
            ) : null}
            {activeTab === "agent" ? (
              <AgentScreen
                agentOpportunities={agentOpportunities}
                claimedOpportunityIds={claimedOpportunityIds}
                deliveredOpportunityIds={deliveredOpportunityIds}
                isAvailable={isAgentAvailable}
                pickedUpOpportunityIds={pickedUpOpportunityIds}
                onBack={() => changeActiveTab("profile")}
                onMarkDelivered={markOpportunityDelivered}
                onMarkPickedUp={markOpportunityPickedUp}
                onToggleAvailability={toggleAgentAvailability}
                onToggleOpportunityClaim={toggleOpportunityClaim}
                onWalletRefresh={refreshWallets}
                onWalletWithdraw={(amountNaira) => withdrawFromWallet("agent", amountNaira)}
                wallet={wallets.agent}
              />
            ) : null}
            {activeTab === "admin" ? (
              <AdminScreen
                onBack={() => changeActiveTab("profile")}
                onWalletRefresh={refreshWallets}
                onWalletWithdraw={(amountNaira) => withdrawFromWallet("admin", amountNaira)}
                wallet={wallets.admin}
              />
            ) : null}
          </ScrollView>
        )}
        {!isRoleDashboard ? <BottomNav activeTab={activeTab} onChange={changeActiveTab} /> : null}
        {isRoleDashboard ? (
          <View style={styles.roleNavWrap}>
            <RoleDashboardNav
              items={
                activeTab === "merchant"
                  ? [
                      { active: true, icon: "grid", label: "Home" },
                      { icon: "receipt", label: "Orders" },
                      { icon: "fast-food", label: "Products" },
                      { icon: "person", label: "Profile", onPress: () => changeActiveTab("profile") }
                    ]
                  : activeTab === "agent"
                    ? [
                        { active: true, icon: "grid", label: "Home" },
                        { icon: "car", label: "Orders" },
                        { icon: "cash", label: "Earnings" },
                        { icon: "person", label: "Profile", onPress: () => changeActiveTab("profile") }
                      ]
                    : [
                        { active: true, icon: "grid", label: "Home" },
                        { icon: "checkmark-done", label: "Queue" },
                        { icon: "warning", label: "Audit" },
                        { icon: "person", label: "Profile", onPress: () => changeActiveTab("profile") }
                      ]
              }
            />
          </View>
        ) : null}
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
  },
  roleDashboardContent: {
    paddingBottom: 112
  },
  ordersContent: {
    flex: 1
  },
  fixedCustomerContent: {
    flex: 1
  },
  roleNavWrap: {
    bottom: 0,
    left: 0,
    paddingBottom: 8,
    paddingHorizontal: 16,
    position: "absolute",
    right: 0
  }
});

function createInitialWallet(role: WalletRole): WalletSummary {
  return {
    role,
    availableBalanceNaira: 0,
    pendingBalanceNaira: 0,
    totalEarnedNaira: 0,
    virtualAccount: "Wallet loading",
    savedBank: "No withdrawal bank saved",
    message: "Loading wallet...",
    ledger: []
  };
}
