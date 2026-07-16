import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { BrandLogo } from "../components/BrandLogo";
import { OrderCard } from "../components/OrderCard";
import { colors } from "../theme/colors";
import { CartItem, Order, PaymentMode } from "../types/domain";
import { formatNaira } from "../utils/money";

type OrderTab = "cart" | "ongoing" | "completed";

type Props = {
  cartItems: CartItem[];
  dataNotice: string;
  orders: Order[];
  paymentMode: PaymentMode;
  onCartQuantityChange: (itemId: string, delta: number) => void;
  onCheckout: (items?: CartItem[]) => void;
  onPaymentModeChange: (mode: PaymentMode) => void;
};

type VendorCart = {
  id: string;
  vendorName: string;
  items: CartItem[];
  subtotal: number;
};

const tabs: { key: OrderTab; label: string }[] = [
  { key: "cart", label: "My cart" },
  { key: "ongoing", label: "Ongoing" },
  { key: "completed", label: "Completed" }
];

export function OrdersScreen({
  cartItems,
  dataNotice,
  onCartQuantityChange,
  onCheckout,
  onPaymentModeChange,
  orders,
  paymentMode
}: Props) {
  const [activeTab, setActiveTab] = useState<OrderTab>("cart");
  const vendorCarts = useMemo(() => groupCartItems(cartItems), [cartItems]);
  const ongoingOrders = orders.filter((order) => !["Delivered", "Cancelled"].includes(order.status));
  const completedOrders = orders.filter((order) => ["Delivered", "Cancelled"].includes(order.status));

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
            onPaymentModeChange={onPaymentModeChange}
            paymentMode={paymentMode}
            vendorCarts={vendorCarts}
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
  onPaymentModeChange,
  paymentMode,
  vendorCarts
}: {
  vendorCarts: VendorCart[];
  paymentMode: PaymentMode;
  onCartQuantityChange: (itemId: string, delta: number) => void;
  onCheckout: (items?: CartItem[]) => void;
  onPaymentModeChange: (mode: PaymentMode) => void;
}) {
  return (
    <View>
      <View style={styles.paymentToggle}>
        {(["Flutterwave", "Pay on Delivery"] as PaymentMode[]).map((mode) => (
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

      {vendorCarts.length > 0 ? (
        vendorCarts.map((cart) => (
          <View key={cart.id} style={styles.cartCard}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.cardTitle}>{cart.vendorName}</Text>
                <Text style={styles.cardSubtle}>{cart.items.length} item cart</Text>
              </View>
              <Text style={styles.cartTotal}>{formatNaira(cart.subtotal)}</Text>
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
            <View style={styles.deliveryLine}>
              <View style={styles.deliveryMeta}>
                <Ionicons color={colors.deepGreen} name="bicycle-outline" size={18} />
                <Text style={styles.cardSubtle}>Delivery fee calculated at checkout</Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => onCheckout(cart.items)} style={styles.checkoutButton}>
              <Text style={styles.checkoutButtonText}>Place this cart</Text>
            </TouchableOpacity>
          </View>
        ))
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
      items: [],
      subtotal: 0
    };

    current.items.push(item);
    current.subtotal += item.quantity * item.unitPriceNaira;
    grouped.set(id, current);
  });

  return Array.from(grouped.values());
}

function getOngoingLabel(order: Order) {
  if (order.fulfilmentMode === "Pickup") {
    return order.status === "Ready" ? "Ready for pickup" : "Pickup cart in progress";
  }

  if (order.status === "In Transit") {
    return "Delivery on the way";
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
  }
});
