import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import {
  Alert,
  BackHandler,
  Linking,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";

import { BottomNav } from "./src/components/BottomNav";
import { RoleDashboardNav } from "./src/components/RoleDashboardNav";
import { AgentScreen } from "./src/screens/AgentScreen";
import { AdminScreen } from "./src/screens/AdminScreen";
import { AddressesScreen } from "./src/screens/AddressesScreen";
import { CommunityScreen } from "./src/screens/CommunityScreen";
import { DiscoverScreen } from "./src/screens/DiscoverScreen";
import { HomeScreen } from "./src/screens/HomeScreen";
import { MerchantScreen } from "./src/screens/MerchantScreen";
import { OrdersScreen } from "./src/screens/OrdersScreen";
import { ProfileEditScreen } from "./src/screens/ProfileEditScreen";
import { ProfileScreen } from "./src/screens/ProfileScreen";
import {
  FavoritesScreen,
  InviteScreen,
  NotificationSettingsScreen,
  SettingsScreen,
  SupportScreen
} from "./src/screens/ProfileUtilityScreens";
import { WalletScreen } from "./src/screens/WalletScreen";
import { createCheckoutOrder } from "./src/repositories/checkoutRepository";
import { getInitialCommerceSnapshot, loadCommerceSnapshot } from "./src/repositories/commerceSnapshot";
import {
  createSavedAddress,
  deleteSavedAddress,
  fallbackAddresses,
  loadSavedAddresses,
  updateSavedAddress
} from "./src/repositories/addressRepository";
import {
  createMerchantProduct,
  updateMerchantStorefront
} from "./src/repositories/merchantProductRepository";
import { updateMerchantOrderStatus } from "./src/repositories/orderStatusRepository";
import { requestPushNotificationPermission } from "./src/repositories/notificationRepository";
import {
  loadWalletSummary,
  requestWalletTopUp,
  requestWalletWithdrawal
} from "./src/repositories/walletRepository";
import {
  isQuicktellerConfigured,
  quicktellerCheckoutBridgeUrl,
  quicktellerCurrencyCode,
  quicktellerMerchantCode,
  quicktellerMode,
  quicktellerPayItemId
} from "./src/lib/productionConfig";
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
  FulfilmentMode,
  AgentDashboardSection,
  AdminDashboardSection,
  NotificationPreference,
  Order,
  OrderStatus,
  PaymentMode,
  Product,
  SavedAddress,
  MerchantDashboardSection,
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

const defaultNotificationPreferences: NotificationPreference[] = [
  { id: "order-status", label: "Order status updates", enabled: true },
  { id: "delivery-arrival", label: "Delivery arrival alerts", enabled: true },
  { id: "merchant-accepted", label: "Merchant accepted orders", enabled: true },
  { id: "food-ready", label: "Food Ready nearby", enabled: true },
  { id: "wallet-activity", label: "Wallet activity", enabled: true },
  { id: "special-offers", label: "Deals and special offers", enabled: true },
  { id: "community", label: "Community updates", enabled: false },
  { id: "admin-announcements", label: "ChowTrek announcements", enabled: true }
];

type ProfilePanel =
  | "profile"
  | "wallet"
  | "edit"
  | "addresses"
  | "favorites"
  | "notifications"
  | "settings"
  | "support"
  | "invite";

type AppRoute = {
  panel: ProfilePanel;
  tab: TabKey;
};

export default function App() {
  const initialSnapshot = getInitialCommerceSnapshot();
  const [activeTab, setActiveTab] = useState<TabKey>("home");
  const [profilePanel, setProfilePanel] = useState<ProfilePanel>("profile");
  const [routeHistory, setRouteHistory] = useState<AppRoute[]>([]);
  const [merchantSection, setMerchantSection] = useState<MerchantDashboardSection>("home");
  const [agentSection, setAgentSection] = useState<AgentDashboardSection>("home");
  const [adminSection, setAdminSection] = useState<AdminDashboardSection>("home");
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
    mergeNotificationPreferences(initialSnapshot.notificationPreferences)
  );
  const [dataNotice, setDataNotice] = useState(initialSnapshot.warning ?? "Loading ChowTrek data...");
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("Pay with card");
  const [wallets, setWallets] = useState<Record<WalletRole, WalletSummary>>(initialWallets);
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>(fallbackAddresses);
  const [isAgentAvailable, setIsAgentAvailable] = useState(true);
  const [claimedOpportunityIds, setClaimedOpportunityIds] = useState<string[]>([]);
  const [pickedUpOpportunityIds, setPickedUpOpportunityIds] = useState<string[]>([]);
  const [arrivedOpportunityIds, setArrivedOpportunityIds] = useState<string[]>([]);
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
        setNotificationPreferences(mergeNotificationPreferences(snapshot.notificationPreferences));
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
    refreshSavedAddresses();
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

  useEffect(() => {
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      if (routeHistory.length === 0) {
        return false;
      }

      const previousRoute = routeHistory[routeHistory.length - 1];
      setRouteHistory((currentHistory) => currentHistory.slice(0, -1));
      setActiveTab(previousRoute.tab);
      setProfilePanel(previousRoute.panel);
      return true;
    });

    return () => subscription.remove();
  }, [routeHistory]);

  async function refreshWallets() {
    const [customer, merchant, agent, admin] = await Promise.all([
      loadWalletSummary("customer"),
      loadWalletSummary("merchant"),
      loadWalletSummary("agent"),
      loadWalletSummary("admin")
    ]);

    setWallets({ customer, merchant, agent, admin });
  }

  async function refreshSavedAddresses() {
    const result = await loadSavedAddresses();
    setSavedAddresses(result.addresses);

    if (result.message) {
      setDataNotice(result.message);
    }
  }

  async function addSavedAddress(label: string, detail: string) {
    const result = await createSavedAddress(label, detail);
    setDataNotice(result.message);

    if (!result.ok || !result.address) {
      return null;
    }

    setSavedAddresses((currentAddresses) => {
      if (currentAddresses.some((address) => address.id === result.address?.id)) {
        return currentAddresses;
      }

      return [...currentAddresses, result.address as SavedAddress];
    });

    return result.address;
  }

  async function editSavedAddress(addressId: string, label: string, detail: string) {
    const result = await updateSavedAddress(addressId, label, detail);
    setDataNotice(result.message);

    if (!result.ok || !result.address) {
      return null;
    }

    setSavedAddresses((currentAddresses) =>
      currentAddresses.map((address) => (address.id === addressId ? result.address as SavedAddress : address))
    );

    return result.address;
  }

  async function removeSavedAddress(addressId: string) {
    const result = await deleteSavedAddress(addressId);
    setDataNotice(result.message);

    if (result.ok) {
      setSavedAddresses((currentAddresses) =>
        currentAddresses.length > 1
          ? currentAddresses.filter((address) => address.id !== addressId)
          : currentAddresses
      );
    }
  }

  async function withdrawFromWallet(role: WalletRole, amountNaira: number) {
    const result = await requestWalletWithdrawal(role, amountNaira);
    setDataNotice(result.message);

    if (result.ok) {
      await refreshWallets();
    }
  }

  async function openWalletTopUp(amountNaira: number) {
    if (!Number.isFinite(amountNaira) || amountNaira < 100) {
      setDataNotice("Enter a wallet top-up amount of at least NGN 100.");
      return;
    }

    if (!isQuicktellerConfigured) {
      setDataNotice("Add card payment test credentials to .env.local to collect card payments.");
      return;
    }

    const reference = `CHOW-WALLET-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const result = await requestWalletTopUp("customer", amountNaira, reference);
    setDataNotice(result.message);

    if (!result.ok) {
      return;
    }

    await Linking.openURL(buildQuicktellerUrl(reference, amountNaira, "wallet_top_up"));
  }

  function openCustomerWallet() {
    navigateTo("profile", "wallet");
  }

  function currentRoute(): AppRoute {
    return {
      panel: profilePanel,
      tab: activeTab
    };
  }

  function goBack() {
    if (routeHistory.length === 0) {
      navigateTo("home");
      return;
    }

    const previousRoute = routeHistory[routeHistory.length - 1];
    setRouteHistory((currentHistory) => currentHistory.slice(0, -1));
    setActiveTab(previousRoute.tab);
    setProfilePanel(previousRoute.panel);
  }

  function navigateTo(tab: TabKey, panel: ProfilePanel = "profile") {
    setRouteHistory((currentHistory) => [...currentHistory, currentRoute()]);
    setActiveTab(tab);
    setProfilePanel(tab === "profile" ? panel : "profile");
  }

  function changeActiveTab(tab: TabKey) {
    navigateTo(tab);
  }

  async function openPushNotificationSettings() {
    navigateTo("profile", "notifications");
  }

  async function requestPushAlerts() {
    try {
      const result = await requestPushNotificationPermission();
      setDataNotice(result.message);
      if (result.ok) {
        const enabledPreferences = notificationPreferences.map((preference) => ({
          ...preference,
          enabled: true
        }));

        setNotificationPreferences(enabledPreferences);
        await Promise.all(enabledPreferences.map(syncNotificationPreference));
      }
      Alert.alert(result.ok ? "Push alerts enabled" : "Push alerts not enabled", result.message);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Push notification setup failed.";
      setDataNotice(message);
      Alert.alert("Push alerts not enabled", message);
    }
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
    const nextPreference =
      notificationPreferences.find((preference) => preference.id === preferenceId) ??
      defaultNotificationPreferences.find((preference) => preference.id === preferenceId);

    if (!nextPreference) {
      return;
    }

    const updatedPreference = {
      ...nextPreference,
      enabled: !nextPreference.enabled
    };

    setNotificationPreferences((currentPreferences) =>
      currentPreferences.map((preference) =>
        preference.id === preferenceId ? updatedPreference : preference
      )
    );

    const result = await syncNotificationPreference(updatedPreference);
    setDataNotice(result.message);
    Alert.alert(
      updatedPreference.enabled ? "Notification enabled" : "Notification disabled",
      result.message
    );
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
          fulfilmentModes: vendor.deliveryModes,
          productName: product.name,
          vendorName: vendor.name,
          quantity: 1,
          unitPriceNaira: product.priceNaira
        }
      ];
    });
    setDataNotice(`${product.name} added to your ${vendor.name} cart.`);
  }

  async function checkoutCart(
    selectedItems = cartItems,
    fulfilmentMode: FulfilmentMode = "Trek Delivery"
  ) {
    try {
      const result = await createCheckoutOrder(selectedItems, paymentMode, fulfilmentMode);

      setDataNotice(result.message);
      if (result.ok) {
        Alert.alert("Cart placed", result.message);
      } else {
        showCheckoutFailure(result.message);
      }

      if (result.ok) {
        const checkedOutItemIds = new Set(selectedItems.map((item) => item.id));
        setCartItems((currentItems) =>
          currentItems.filter((item) => !checkedOutItemIds.has(item.id))
        );
        if (result.paymentUrl) {
          await Linking.openURL(result.paymentUrl);
        }
        const snapshot = await loadCommerceSnapshot();
        setOrders(snapshot.orders);
        setAgentOpportunities(snapshot.agentOpportunities);
        await refreshWallets();
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Checkout failed before placing the cart.";
      setDataNotice(message);
      showCheckoutFailure(message);
    }
  }

  function showCheckoutFailure(message: string) {
    if (message.includes("Save your phone number")) {
      Alert.alert("Cart not placed", message, [
        { text: "Cancel", style: "cancel" },
        { text: "Save number", onPress: () => navigateTo("profile", "edit") }
      ]);
      return;
    }

    Alert.alert("Cart not placed", message);
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
      setArrivedOpportunityIds((currentIds) => currentIds.filter((id) => id !== opportunityId));
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

    if (result.ok) {
      const snapshot = await loadCommerceSnapshot();
      setOrders(snapshot.orders);
      setAgentOpportunities(snapshot.agentOpportunities);
    }
  }

  async function markOpportunityArrived(opportunityId: string) {
    const opportunity = agentOpportunities.find((item) => item.id === opportunityId);
    const isPickedUp =
      pickedUpOpportunityIds.includes(opportunityId) ||
      opportunity?.stage === "Picked Up" ||
      opportunity?.stage === "Arrived" ||
      opportunity?.stage === "Delivered";

    if (!isPickedUp) {
      setDataNotice("Mark pickup before marking arrival.");
      return;
    }

    setArrivedOpportunityIds((currentIds) =>
      currentIds.includes(opportunityId) ? currentIds : [...currentIds, opportunityId]
    );
    const result = await syncDeliveryStage(opportunityId, "arrived");
    setDataNotice(result.message);

    if (result.ok) {
      const snapshot = await loadCommerceSnapshot();
      setOrders(snapshot.orders);
      setAgentOpportunities(snapshot.agentOpportunities);
    }
  }

  async function markOpportunityDelivered(opportunityId: string) {
    const opportunity = agentOpportunities.find((item) => item.id === opportunityId);
    const hasArrived =
      arrivedOpportunityIds.includes(opportunityId) ||
      opportunity?.stage === "Arrived" ||
      opportunity?.stage === "Delivered";

    if (!hasArrived) {
      setDataNotice("Mark arrival before completing delivery.");
      return;
    }

    setDeliveredOpportunityIds((currentIds) =>
      currentIds.includes(opportunityId) ? currentIds : [...currentIds, opportunityId]
    );
    const result = await syncDeliveryStage(opportunityId, "delivered");
    setDataNotice(result.message);

    if (result.ok) {
      const snapshot = await loadCommerceSnapshot();
      setOrders(snapshot.orders);
      setAgentOpportunities(snapshot.agentOpportunities);
    }
  }

  async function toggleAgentAvailability() {
    const nextAvailability = !isAgentAvailable;

    setIsAgentAvailable(nextAvailability);
    const result = await syncAgentAvailability(nextAvailability);
    setDataNotice(result.message);
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor={colors.surface} style="dark" translucent={false} />
      <View style={styles.app}>
        {activeTab === "home" ? (
          <View style={[styles.content, styles.fixedCustomerContent]}>
            <HomeScreen
              addresses={savedAddresses}
              cartItems={cartItems}
              dataNotice={dataNotice}
              onAddToCart={addProductToCart}
              onCartQuantityChange={changeCartQuantity}
              onCreateAddress={() => {
                navigateTo("profile", "addresses");
              }}
              onOpenAddresses={() => navigateTo("profile", "addresses")}
              onOpenCart={() => changeActiveTab("orders")}
              onOpenNotifications={openPushNotificationSettings}
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
                onOpenAddresses={() => navigateTo("profile", "addresses")}
                onOpenEdit={() => navigateTo("profile", "edit")}
                onOpenFavorites={() => navigateTo("profile", "favorites")}
                onOpenInvite={() => navigateTo("profile", "invite")}
                onOpenNotifications={openPushNotificationSettings}
                onOpenRole={changeActiveTab}
                onOpenSettings={() => navigateTo("profile", "settings")}
                onOpenSupport={() => navigateTo("profile", "support")}
                onOpenWallet={openCustomerWallet}
                wallet={wallets.customer}
              />
            ) : null}
            {activeTab === "profile" && profilePanel === "edit" ? (
              <ProfileEditScreen onBack={goBack} />
            ) : null}
            {activeTab === "profile" && profilePanel === "wallet" ? (
              <WalletScreen
                onAddMoney={(amountNaira) => {
                  void openWalletTopUp(amountNaira);
                }}
                onBack={goBack}
                onRefresh={refreshWallets}
                wallet={wallets.customer}
              />
            ) : null}
            {activeTab === "profile" && profilePanel === "addresses" ? (
              <AddressesScreen
                addresses={savedAddresses}
                onAddAddress={addSavedAddress}
                onBack={goBack}
                onDeleteAddress={(addressId) => {
                  void removeSavedAddress(addressId);
                }}
                onRefresh={refreshSavedAddresses}
                onUpdateAddress={editSavedAddress}
              />
            ) : null}
            {activeTab === "profile" && profilePanel === "favorites" ? (
              <FavoritesScreen
                onBack={goBack}
                onOpenVendor={() => navigateTo("home")}
                vendors={vendors}
              />
            ) : null}
            {activeTab === "profile" && profilePanel === "notifications" ? (
              <NotificationSettingsScreen
                notificationPreferences={notificationPreferences}
                onBack={goBack}
                onRequestPush={requestPushAlerts}
                onToggleNotification={toggleNotificationPreference}
              />
            ) : null}
            {activeTab === "profile" && profilePanel === "settings" ? (
              <SettingsScreen onBack={goBack} />
            ) : null}
            {activeTab === "profile" && profilePanel === "support" ? (
              <SupportScreen onBack={goBack} />
            ) : null}
            {activeTab === "profile" && profilePanel === "invite" ? (
              <InviteScreen onBack={goBack} />
            ) : null}
            {activeTab === "merchant" ? (
              <MerchantScreen
                activeSection={merchantSection}
                onCreateProduct={addMerchantProduct}
                onBack={goBack}
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
                activeSection={agentSection}
                agentOpportunities={agentOpportunities}
                arrivedOpportunityIds={arrivedOpportunityIds}
                claimedOpportunityIds={claimedOpportunityIds}
                deliveredOpportunityIds={deliveredOpportunityIds}
                isAvailable={isAgentAvailable}
                pickedUpOpportunityIds={pickedUpOpportunityIds}
                onBack={goBack}
                onMarkArrived={markOpportunityArrived}
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
                activeSection={adminSection}
                onBack={goBack}
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
                      {
                        active: merchantSection === "home",
                        icon: "grid",
                        label: "Home",
                        onPress: () => setMerchantSection("home")
                      },
                      {
                        active: merchantSection === "orders",
                        icon: "receipt",
                        label: "Orders",
                        onPress: () => setMerchantSection("orders")
                      },
                      {
                        active: merchantSection === "products",
                        icon: "fast-food",
                        label: "Products",
                        onPress: () => setMerchantSection("products")
                      },
                      { icon: "person", label: "Profile", onPress: () => changeActiveTab("profile") }
                    ]
                  : activeTab === "agent"
                    ? [
                        {
                          active: agentSection === "home",
                          icon: "grid",
                          label: "Home",
                          onPress: () => setAgentSection("home")
                        },
                        {
                          active: agentSection === "orders",
                          icon: "car",
                          label: "Orders",
                          onPress: () => setAgentSection("orders")
                        },
                        {
                          active: agentSection === "earnings",
                          icon: "cash",
                          label: "Earnings",
                          onPress: () => setAgentSection("earnings")
                        },
                        { icon: "person", label: "Profile", onPress: () => changeActiveTab("profile") }
                      ]
                    : [
                        {
                          active: adminSection === "home",
                          icon: "grid",
                          label: "Home",
                          onPress: () => setAdminSection("home")
                        },
                        {
                          active: adminSection === "queue",
                          icon: "checkmark-done",
                          label: "Queue",
                          onPress: () => setAdminSection("queue")
                        },
                        {
                          active: adminSection === "audit",
                          icon: "warning",
                          label: "Audit",
                          onPress: () => setAdminSection("audit")
                        },
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
    flex: 1,
    paddingTop: 0
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

function mergeNotificationPreferences(
  preferences: NotificationPreference[]
): NotificationPreference[] {
  const savedPreferences = new Map(
    preferences.map((preference) => [preference.id, preference])
  );

  return defaultNotificationPreferences.map((defaultPreference) => ({
    ...defaultPreference,
    ...savedPreferences.get(defaultPreference.id)
  }));
}

function buildQuicktellerUrl(reference: string, amountNaira: number, purpose: string): string {
  const url = new URL(quicktellerCheckoutBridgeUrl);
  url.searchParams.set("merchant_code", quicktellerMerchantCode);
  url.searchParams.set("pay_item_id", quicktellerPayItemId);
  url.searchParams.set("txn_ref", reference);
  url.searchParams.set("amount", String(amountNaira * 100));
  url.searchParams.set("currency", quicktellerCurrencyCode);
  url.searchParams.set("mode", quicktellerMode);
  url.searchParams.set("cust_email", "customer@chowtrek.app");
  url.searchParams.set("cust_id", purpose);
  url.searchParams.set("pay_item_name", "ChowTrek wallet top-up");
  url.searchParams.set("site_redirect_url", "https://chowtrek-landing.vercel.app/payment-return/");

  return url.toString();
}
