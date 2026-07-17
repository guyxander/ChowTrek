import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { BrandLogo } from "../components/BrandLogo";
import { OrderCard } from "../components/OrderCard";
import { colors } from "../theme/colors";
import { CartItem, FulfilmentMode, Order, PaymentMode, WalletSummary } from "../types/domain";
import { formatNaira } from "../utils/money";

type OrderTab = "cart" | "ongoing" | "completed";

type Props = {
  cartItems: CartItem[];
  dataNotice: string;
  orders: Order[];
  paymentMode: PaymentMode;
  wallet: WalletSummary;
  onCartQuantityChange: (itemId: string, delta: number) => void;
  onCheckout: (items?: CartItem[], fulfilmentMode?: FulfilmentMode) => Promise<void> | void;
  onOpenWallet: () => void;
  onPaymentModeChange: (mode: PaymentMode) => void;
  onWalletRefresh: () => void;
};

type VendorCart = {
  id: string;
  vendorName: string;
  items: CartItem[];
  fulfilmentModes: FulfilmentMode[];
  subtotal: number;
};

const tabs: { key: OrderTab; label: string }[] = [
  { key: "cart", label: "My cart" },
  { key: "ongoing", label: "Ongoing" },
  { key: "completed", label: "Completed" }
];

const fallbackFulfilmentModes: FulfilmentMode[] = ["Trek Delivery", "Pickup"];
const fulfilmentFees: Record<FulfilmentMode, number> = {
  "Trek Delivery": 700,
  Pickup: 0,
  Express: 1200
};

export function OrdersScreen({
  cartItems,
  dataNotice,
  onCartQuantityChange,
  onCheckout,
  onOpenWallet,
  onPaymentModeChange,
  onWalletRefresh,
  orders,
  paymentMode,
  wallet
}: Props) {
  const [activeTab, setActiveTab] = useState<OrderTab>("cart");
  const [selectedFulfilmentModes, setSelectedFulfilmentModes] = useState<
    Record<string, FulfilmentMode>
  >({});
  const [pendingCheckoutCartId, setPendingCheckoutCartId] = useState<string | null>(null);
  const vendorCarts = useMemo(() => groupCartItems(cartItems), [cartItems]);
  const ongoingOrders = orders.filter((order) => !["Delivered", "Cancelled"].includes(order.status));
  const completedOrders = orders.filter((order) => ["Delivered", "Cancelled"].includes(order.status));

  useEffect(() => {
    setSelectedFulfilmentModes((currentModes) => {
      const nextModes: Record<string, FulfilmentMode> = {};

      vendorCarts.forEach((cart) => {
        const currentMode = currentModes[cart.id];
        nextModes[cart.id] = cart.fulfilmentModes.includes(currentMode)
          ? currentMode
          : getDefaultFulfilmentMode(cart.fulfilmentModes);
      });

      return nextModes;
    });
  }, [vendorCarts]);

  return (
    <View style={styles.screen}>
      <View style={styles.fixedHeader}>
        <View style={styles.topRow}>
          <View style={styles.brandLockup}>
            <BrandLogo size={42} />
            <View>
              <Text style={styles.brand}>ChowTrek</Text>
              <Text style={styles.title}>Orders</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons color={colors.deepGreen} name="receipt" size={22} />
          </TouchableOpacity>
        </View>

        <View style={styles.searchBar}>
          <Ionicons color={colors.muted} name="search" size={19} />
          <Text style={styles.searchText}>Search carts and orders</Text>
        </View>

        <Text style={styles.dataNotice}>{dataNotice}</Text>

        <View style={styles.tabBar}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            const count =
              tab.key === "cart"
                ? vendorCarts.length
                : tab.key === "ongoing"
                  ? ongoingOrders.length
                  : completedOrders.length;

            return (
              <TouchableOpacity
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                style={[styles.tabButton, isActive ? styles.tabButtonActive : null]}
              >
                <Text style={[styles.tabText, isActive ? styles.tabTextActive : null]}>
                  {tab.label}
                </Text>
                <View style={[styles.countPill, isActive ? styles.countPillActive : null]}>
                  <Text style={[styles.countText, isActive ? styles.countTextActive : null]}>
                    {count}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        style={styles.scrollArea}
      >
        {activeTab === "cart" ? (
          <CartTab
            onCartQuantityChange={onCartQuantityChange}
            onCheckout={onCheckout}
            onOpenWallet={onOpenWallet}
            onPaymentModeChange={onPaymentModeChange}
            onSelectFulfilmentMode={(cartId, mode) =>
              setSelectedFulfilmentModes((currentModes) => ({ ...currentModes, [cartId]: mode }))
            }
            onWalletRefresh={onWalletRefresh}
            pendingCheckoutCartId={pendingCheckoutCartId}
            paymentMode={paymentMode}
            selectedFulfilmentModes={selectedFulfilmentModes}
            wallet={wallet}
            vendorCarts={vendorCarts}
            onCheckoutSettled={() => setPendingCheckoutCartId(null)}
            onCheckoutStarted={(cartId) => setPendingCheckoutCartId(cartId)}
          />
        ) : null}
        {activeTab === "ongoing" ? <OngoingTab orders={ongoingOrders} /> : null}
        {activeTab === "completed" ? <CompletedTab orders={completedOrders} /> : null}
      </ScrollView>
    </View>
  );
}

function CartTab({
  onCartQuantityChange,
  onCheckout,
  onOpenWallet,
  onPaymentModeChange,
  onSelectFulfilmentMode,
  onCheckoutSettled,
  onCheckoutStarted,
  onWalletRefresh,
  paymentMode,
  pendingCheckoutCartId,
  selectedFulfilmentModes,
  wallet,
  vendorCarts
}: {
  vendorCarts: VendorCart[];
  paymentMode: PaymentMode;
  pendingCheckoutCartId: string | null;
  selectedFulfilmentModes: Record<string, FulfilmentMode>;
  wallet: WalletSummary;
  onCartQuantityChange: (itemId: string, delta: number) => void;
  onCheckout: (items?: CartItem[], fulfilmentMode?: FulfilmentMode) => Promise<void> | void;
  onCheckoutSettled: () => void;
  onCheckoutStarted: (cartId: string) => void;
  onOpenWallet: () => void;
  onPaymentModeChange: (mode: PaymentMode) => void;
  onSelectFulfilmentMode: (cartId: string, mode: FulfilmentMode) => void;
  onWalletRefresh: () => void;
}) {
  return (
    <View>
      <View style={styles.paymentToggle}>
        {(["Wallet", "Flutterwave", "Pay on Delivery"] as PaymentMode[]).map((mode) => (
          <TouchableOpacity
            key={mode}
            onPress={() => onPaymentModeChange(mode)}
            style={[styles.paymentOption, paymentMode === mode ? styles.paymentOptionActive : null]}
          >
            <Text
              style={[
                styles.paymentOptionText,
                paymentMode === mode ? styles.paymentOptionTextActive : null
              ]}
            >
              {mode}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.walletSummary}>
        <View style={styles.walletSummaryIcon}>
          <Ionicons color={colors.deepGreen} name="wallet-outline" size={21} />
        </View>
        <View style={styles.walletSummaryCopy}>
          <Text style={styles.walletSummaryLabel}>Wallet balance</Text>
          <Text style={styles.walletSummaryValue}>{formatNaira(wallet.availableBalanceNaira)}</Text>
        </View>
        <TouchableOpacity onPress={onOpenWallet} style={styles.walletTopUpButton}>
          <Text style={styles.walletTopUpText}>Top up</Text>
        </TouchableOpacity>
        <TouchableOpacity
          accessibilityLabel="Refresh wallet balance"
          onPress={onWalletRefresh}
          style={styles.walletRefresh}
        >
          <Ionicons color={colors.deepGreen} name="refresh" size={18} />
        </TouchableOpacity>
      </View>

      {vendorCarts.length > 0 ? (
        vendorCarts.map((cart) => {
          const selectedMode =
            selectedFulfilmentModes[cart.id] ?? getDefaultFulfilmentMode(cart.fulfilmentModes);
          const fee = fulfilmentFees[selectedMode];
          const total = cart.subtotal + fee;
          const isPlacingCart = pendingCheckoutCartId === cart.id;

          return (
            <View key={cart.id} style={styles.cartCard}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.cardTitle}>{cart.vendorName}</Text>
                  <Text style={styles.cardSubtle}>{cart.items.length} item cart</Text>
                </View>
                <Text style={styles.cartTotal}>{formatNaira(total)}</Text>
              </View>
              {cart.items.map((item) => (
                <View key={item.id} style={styles.cartLine}>
                  <View style={styles.cartInfo}>
                    <Text style={styles.itemName}>{item.productName}</Text>
                    <Text style={styles.cardSubtle}>{formatNaira(item.unitPriceNaira)} each</Text>
                    <View style={styles.quantityRow}>
                      <TouchableOpacity
                        onPress={() => onCartQuantityChange(item.id, -1)}
                        style={styles.quantityButton}
                      >
                        <Text style={styles.quantityButtonText}>-</Text>
                      </TouchableOpacity>
                      <Text style={styles.quantityText}>{item.quantity}</Text>
                      <TouchableOpacity
                        onPress={() => onCartQuantityChange(item.id, 1)}
                        style={styles.quantityButton}
                      >
                        <Text style={styles.quantityButtonText}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  <Text style={styles.lineAmount}>
                    {formatNaira(item.quantity * item.unitPriceNaira)}
                  </Text>
                </View>
              ))}
              <View style={styles.fulfilmentBlock}>
                <Text style={styles.fulfilmentLabel}>Fulfilment</Text>
                <View style={styles.fulfilmentOptions}>
                  {cart.fulfilmentModes.map((mode) => {
                    const isActive = selectedMode === mode;

                    return (
                      <TouchableOpacity
                        key={mode}
                        onPress={() => onSelectFulfilmentMode(cart.id, mode)}
                        style={[
                          styles.fulfilmentOption,
                          isActive ? styles.fulfilmentOptionActive : null
                        ]}
                      >
                        <Ionicons
                          color={isActive ? "#ffffff" : colors.deepGreen}
                          name={getFulfilmentIcon(mode)}
                          size={16}
                        />
                        <Text
                          style={[
                            styles.fulfilmentOptionText,
                            isActive ? styles.fulfilmentOptionTextActive : null
                          ]}
                        >
                          {mode}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
              <View style={styles.deliveryLine}>
                <View style={styles.deliveryMeta}>
                  <Ionicons
                    color={colors.deepGreen}
                    name={getFulfilmentIcon(selectedMode)}
                    size={18}
                  />
                  <Text style={styles.cardSubtle}>
                    {selectedMode === "Pickup"
                      ? "Pickup has no delivery fee"
                      : `${selectedMode} fee: ${formatNaira(fee)}`}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                disabled={isPlacingCart}
                onPress={() => {
                  onCheckoutStarted(cart.id);
                  void Promise.resolve(onCheckout(cart.items, selectedMode)).finally(onCheckoutSettled);
                }}
                style={[styles.checkoutButton, isPlacingCart ? styles.checkoutButtonDisabled : null]}
              >
                <Text style={styles.checkoutButtonText}>
                  {isPlacingCart ? "Placing cart..." : "Place this cart"}
                </Text>
              </TouchableOpacity>
            </View>
          );
        })
      ) : (
        <EmptyState
          icon="cart-outline"
          title="Cart is empty"
          body="Add available food from nearby vendors. Each vendor will appear as a separate cart."
        />
      )}
    </View>
  );
}

function OngoingTab({ orders }: { orders: Order[] }) {
  return (
    <View>
      {orders.length > 0 ? (
        orders.map((order) => (
          <View key={order.id} style={styles.orderWrap}>
            <View style={styles.orderContext}>
              <Ionicons
                color={colors.deepGreen}
                name={order.fulfilmentMode === "Pickup" ? "bag-handle" : "bicycle"}
                size={18}
              />
              <Text style={styles.orderContextText}>{getOngoingLabel(order)}</Text>
            </View>
            <OrderCard order={order} />
          </View>
        ))
      ) : (
        <EmptyState
          icon="time-outline"
          title="No ongoing carts"
          body="Delivery orders on the way and pickup orders ready for collection will appear here."
        />
      )}
    </View>
  );
}

function CompletedTab({ orders }: { orders: Order[] }) {
  return (
    <View>
      {orders.length > 0 ? (
        orders.map((order) => (
          <View key={order.id} style={styles.orderWrap}>
            <View style={styles.orderContext}>
              <Ionicons
                color={order.status === "Cancelled" ? colors.error : colors.deepGreen}
                name={order.status === "Cancelled" ? "close-circle" : "checkmark-circle"}
                size={18}
              />
              <Text style={styles.orderContextText}>
                {order.status === "Cancelled" ? "Cancelled cart" : "Completed cart"}
              </Text>
            </View>
            <OrderCard order={order} />
          </View>
        ))
      ) : (
        <EmptyState
          icon="checkmark-done-outline"
          title="No completed carts yet"
          body="Delivered, picked-up, and cancelled carts will move here."
        />
      )}
    </View>
  );
}

function EmptyState({
  body,
  icon,
  title
}: {
  body: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
}) {
  return (
    <View style={styles.emptyCard}>
      <View style={styles.emptyIcon}>
        <Ionicons color={colors.deepGreen} name={icon} size={24} />
      </View>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.emptyBody}>{body}</Text>
    </View>
  );
}

function groupCartItems(items: CartItem[]): VendorCart[] {
  const grouped = new Map<string, VendorCart>();

  items.forEach((item) => {
    const id = item.vendorId ?? item.vendorName;
    const current = grouped.get(id) ?? {
      id,
      vendorName: item.vendorName,
      fulfilmentModes: item.fulfilmentModes ?? fallbackFulfilmentModes,
      items: [],
      subtotal: 0
    };

    current.items.push(item);
    current.subtotal += item.quantity * item.unitPriceNaira;
    grouped.set(id, current);
  });

  return Array.from(grouped.values());
}

function getDefaultFulfilmentMode(modes: FulfilmentMode[]) {
  return modes.includes("Trek Delivery") ? "Trek Delivery" : modes[0] ?? "Pickup";
}

function getFulfilmentIcon(mode: FulfilmentMode): keyof typeof Ionicons.glyphMap {
  if (mode === "Pickup") {
    return "storefront-outline";
  }

  if (mode === "Trek Delivery") {
    return "walk";
  }

  return "bicycle-outline";
}

function getOngoingLabel(order: Order) {
  if (order.fulfilmentMode === "Pickup") {
    return order.status === "Ready" ? "Ready for pickup" : "Pickup cart in progress";
  }

  if (order.status === "In Transit") {
    return "Delivery on the way";
  }

  if (order.status === "Arrived") {
    return "Delivery agent has arrived";
  }

  if (order.status === "Ready") {
    return "Waiting for delivery pickup";
  }

  return "Delivery cart in progress";
}

const styles = StyleSheet.create({
  brand: {
    color: colors.deepGreen,
    fontSize: 14,
    fontWeight: "900"
  },
  brandLockup: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10
  },
  cardHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8
  },
  cardSubtle: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700"
  },
  cardTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "900"
  },
  cartCard: {
    backgroundColor: colors.card,
    borderColor: "rgba(191, 201, 195, 0.28)",
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 12,
    padding: 16
  },
  cartInfo: {
    flex: 1,
    paddingRight: 12
  },
  cartLine: {
    alignItems: "center",
    borderTopColor: colors.line,
    borderTopWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12
  },
  cartTotal: {
    color: colors.deepGreen,
    fontSize: 16,
    fontWeight: "900"
  },
  checkoutButton: {
    alignItems: "center",
    backgroundColor: colors.deepGreen,
    borderRadius: 10,
    marginTop: 12,
    paddingVertical: 13
  },
  checkoutButtonDisabled: {
    opacity: 0.72
  },
  checkoutButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "900"
  },
  countPill: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 999,
    minWidth: 22,
    paddingHorizontal: 7,
    paddingVertical: 3
  },
  countPillActive: {
    backgroundColor: "rgba(255, 255, 255, 0.18)"
  },
  countText: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "900",
    textAlign: "center"
  },
  countTextActive: {
    color: "#ffffff"
  },
  dataNotice: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 10
  },
  deliveryLine: {
    borderTopColor: colors.line,
    borderTopWidth: 1,
    paddingTop: 12
  },
  deliveryMeta: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6
  },
  emptyBody: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
    marginTop: 6,
    textAlign: "center"
  },
  emptyCard: {
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 22
  },
  emptyIcon: {
    alignItems: "center",
    backgroundColor: colors.successSoft,
    borderRadius: 20,
    height: 44,
    justifyContent: "center",
    marginBottom: 12,
    width: 44
  },
  fixedHeader: {
    backgroundColor: colors.surface,
    paddingBottom: 12
  },
  fulfilmentBlock: {
    borderTopColor: colors.line,
    borderTopWidth: 1,
    gap: 8,
    paddingTop: 12
  },
  fulfilmentLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  fulfilmentOption: {
    alignItems: "center",
    backgroundColor: colors.successSoft,
    borderRadius: 999,
    flexDirection: "row",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 8
  },
  fulfilmentOptionActive: {
    backgroundColor: colors.deepGreen
  },
  fulfilmentOptionText: {
    color: colors.deepGreen,
    fontSize: 12,
    fontWeight: "900"
  },
  fulfilmentOptionTextActive: {
    color: "#ffffff"
  },
  fulfilmentOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  iconButton: {
    alignItems: "center",
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 12,
    height: 44,
    justifyContent: "center",
    width: 44
  },
  itemName: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "900"
  },
  lineAmount: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "900"
  },
  orderContext: {
    alignItems: "center",
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 999,
    flexDirection: "row",
    gap: 7,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 7
  },
  orderContextText: {
    color: colors.deepGreen,
    fontSize: 12,
    fontWeight: "900"
  },
  orderWrap: {
    marginBottom: 12
  },
  paymentOption: {
    alignItems: "center",
    borderRadius: 999,
    flex: 1,
    paddingVertical: 10
  },
  paymentOptionActive: {
    backgroundColor: colors.deepGreen
  },
  paymentOptionText: {
    color: colors.deepGreen,
    fontSize: 13,
    fontWeight: "900"
  },
  paymentOptionTextActive: {
    color: "#ffffff"
  },
  paymentToggle: {
    backgroundColor: colors.successSoft,
    borderRadius: 999,
    flexDirection: "row",
    gap: 6,
    marginBottom: 12,
    padding: 4
  },
  quantityButton: {
    alignItems: "center",
    backgroundColor: colors.successSoft,
    borderRadius: 14,
    height: 28,
    justifyContent: "center",
    width: 28
  },
  quantityButtonText: {
    color: colors.deepGreen,
    fontSize: 18,
    fontWeight: "900",
    lineHeight: 20
  },
  quantityRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    marginTop: 8
  },
  quantityText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "900",
    minWidth: 18,
    textAlign: "center"
  },
  screen: {
    flex: 1
  },
  scrollArea: {
    flex: 1
  },
  scrollContent: {
    paddingBottom: 8
  },
  searchBar: {
    alignItems: "center",
    backgroundColor: colors.card,
    borderColor: "rgba(191, 201, 195, 0.26)",
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    marginTop: 14,
    paddingHorizontal: 14,
    paddingVertical: 12
  },
  searchText: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: "700"
  },
  tabBar: {
    backgroundColor: colors.card,
    borderColor: "rgba(191, 201, 195, 0.26)",
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    gap: 6,
    marginTop: 12,
    padding: 4
  },
  tabButton: {
    alignItems: "center",
    borderRadius: 11,
    flex: 1,
    flexDirection: "row",
    gap: 5,
    justifyContent: "center",
    minHeight: 42,
    paddingHorizontal: 4
  },
  tabButtonActive: {
    backgroundColor: colors.deepGreen
  },
  tabText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "900"
  },
  tabTextActive: {
    color: "#ffffff"
  },
  title: {
    color: colors.text,
    fontSize: 26,
    fontWeight: "900",
    marginTop: 1
  },
  topRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  walletRefresh: {
    alignItems: "center",
    backgroundColor: colors.successSoft,
    borderRadius: 999,
    height: 34,
    justifyContent: "center",
    width: 34
  },
  walletSummary: {
    alignItems: "center",
    backgroundColor: colors.card,
    borderColor: "rgba(191, 201, 195, 0.28)",
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
    padding: 12
  },
  walletSummaryCopy: {
    flex: 1
  },
  walletSummaryIcon: {
    alignItems: "center",
    backgroundColor: colors.successSoft,
    borderRadius: 12,
    height: 42,
    justifyContent: "center",
    width: 42
  },
  walletSummaryLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  walletSummaryValue: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "900",
    marginTop: 2
  },
  walletTopUpButton: {
    backgroundColor: colors.deepGreen,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  walletTopUpText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "900"
  }
});
