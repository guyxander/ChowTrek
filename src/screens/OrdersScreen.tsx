import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { CartSummary } from "../components/CartSummary";
import { OrderCard } from "../components/OrderCard";
import { colors } from "../theme/colors";
import { sharedStyles } from "../theme/sharedStyles";
import { CartItem, Order, PaymentMode } from "../types/domain";

type Props = {
  cartItems: CartItem[];
  orders: Order[];
  paymentMode: PaymentMode;
  onCartQuantityChange: (itemId: string, delta: number) => void;
  onCheckout: () => void;
  onPaymentModeChange: (mode: PaymentMode) => void;
};

export function OrdersScreen({
  cartItems,
  onCartQuantityChange,
  onCheckout,
  onPaymentModeChange,
  orders,
  paymentMode
}: Props) {
  return (
    <View>
      <Text style={sharedStyles.screenTitle}>Orders</Text>
      <View style={sharedStyles.card}>
        <Text style={sharedStyles.cardTitle}>Checkout payments</Text>
        <Text style={sharedStyles.bodyCopy}>
          Flutterwave checkout creates a trackable payment reference. Add live Flutterwave keys when
          the business account is ready; pay on delivery stays available for cash testing.
        </Text>
      </View>
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
      <CartSummary
        items={cartItems}
        onQuantityChange={onCartQuantityChange}
        paymentMode={paymentMode}
      />
      <TouchableOpacity
        disabled={cartItems.length === 0}
        onPress={onCheckout}
        style={[styles.checkoutButton, cartItems.length === 0 ? styles.checkoutButtonDisabled : null]}
      >
        <Text style={styles.checkoutButtonText}>Place order</Text>
      </TouchableOpacity>
      {orders.length > 0 ? (
        orders.map((order) => <OrderCard key={order.id} order={order} />)
      ) : (
        <View style={sharedStyles.card}>
          <Text style={sharedStyles.cardTitle}>No orders yet</Text>
          <Text style={sharedStyles.bodyCopy}>
            Orders you place will show payment status, delivery progress, and receipts here.
          </Text>
        </View>
      )}
      <View style={sharedStyles.card}>
        <Text style={sharedStyles.cardTitle}>Live delivery tracking</Text>
        <Text style={sharedStyles.bodyCopy}>
          Customer and merchant visibility will use realtime GPS once Supabase and location
          permissions are connected.
        </Text>
        <View style={styles.routeRail}>
          <RouteStep icon="storefront-outline" label="Merchant" />
          <View style={styles.routeLine} />
          <RouteStep icon="bicycle-outline" label="Agent" />
          <View style={styles.routeLine} />
          <RouteStep icon="home-outline" label="Customer" />
        </View>
      </View>
    </View>
  );
}

function RouteStep({
  icon,
  label
}: {
  icon: "storefront-outline" | "bicycle-outline" | "home-outline";
  label: string;
}) {
  return (
    <View style={styles.routeStep}>
      <View style={styles.routeIcon}>
        <Ionicons color={colors.deepGreen} name={icon} size={18} />
      </View>
      <Text style={styles.routeLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
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
  checkoutButton: {
    alignItems: "center",
    backgroundColor: colors.deepGreen,
    borderRadius: 8,
    marginBottom: 12,
    marginTop: -4,
    paddingVertical: 14
  },
  checkoutButtonDisabled: {
    opacity: 0.45
  },
  checkoutButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "900"
  },
  routeIcon: {
    alignItems: "center",
    backgroundColor: colors.successSoft,
    borderRadius: 20,
    height: 40,
    justifyContent: "center",
    width: 40
  },
  routeLabel: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "800"
  },
  routeLine: {
    backgroundColor: colors.line,
    flex: 1,
    height: 2,
    marginTop: 20
  },
  routeRail: {
    alignItems: "flex-start",
    flexDirection: "row",
    marginTop: 18
  },
  routeStep: {
    alignItems: "center",
    gap: 6
  }
});
