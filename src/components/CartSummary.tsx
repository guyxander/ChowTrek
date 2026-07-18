import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { colors } from "../theme/colors";
import { sharedStyles } from "../theme/sharedStyles";
import { CartItem, PaymentMode } from "../types/domain";
import { formatNaira } from "../utils/money";

type Props = {
  items: CartItem[];
  paymentMode: PaymentMode;
  onQuantityChange: (itemId: string, delta: number) => void;
};

export function CartSummary({ items, onQuantityChange, paymentMode }: Props) {
  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPriceNaira, 0);
  const deliveryFee = 700;
  const total = subtotal + deliveryFee;

  return (
    <View style={sharedStyles.card}>
      <View style={styles.header}>
        <Text style={sharedStyles.cardTitle}>Cart</Text>
        <View style={styles.modePill}>
          <Text style={styles.modeText}>{paymentMode}</Text>
        </View>
      </View>
      {items.length > 0 ? (
        items.map((item) => (
          <View key={item.id} style={styles.cartLine}>
            <View style={styles.cartInfo}>
              <Text style={styles.itemName}>{item.productName}</Text>
              <Text style={sharedStyles.subtle}>{item.vendorName}</Text>
              <View style={styles.quantityRow}>
                <TouchableOpacity
                  onPress={() => onQuantityChange(item.id, -1)}
                  style={styles.quantityButton}
                >
                  <Text style={styles.quantityButtonText}>-</Text>
                </TouchableOpacity>
                <Text style={styles.quantityText}>{item.quantity}</Text>
                <TouchableOpacity
                  onPress={() => onQuantityChange(item.id, 1)}
                  style={styles.quantityButton}
                >
                  <Text style={styles.quantityButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
            <Text style={styles.amount}>{formatNaira(item.quantity * item.unitPriceNaira)}</Text>
          </View>
        ))
      ) : (
        <View style={styles.emptyCart}>
          <Text style={sharedStyles.cardTitle}>Cart is empty</Text>
          <Text style={sharedStyles.bodyCopy}>Add available food from nearby vendors.</Text>
        </View>
      )}
      <View style={styles.totalLine}>
        <View style={styles.deliveryMeta}>
          <Ionicons color={colors.deepGreen} name="bicycle-outline" size={18} />
          <Text style={sharedStyles.metaText}>Trek Delivery fee</Text>
        </View>
        <Text style={styles.amount}>{formatNaira(deliveryFee)}</Text>
      </View>
      <View style={styles.grandTotal}>
        <Text style={styles.totalLabel}>Total</Text>
        <Text style={styles.totalAmount}>{formatNaira(total)}</Text>
      </View>
      <Text style={styles.noWallet}>Wallet, card, and pay-on-delivery are available at checkout.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  amount: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "800"
  },
  cartLine: {
    alignItems: "center",
    borderTopColor: colors.line,
    borderTopWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12
  },
  cartInfo: {
    flex: 1,
    paddingRight: 12
  },
  deliveryMeta: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6
  },
  grandTotal: {
    alignItems: "center",
    borderTopColor: colors.deepGreen,
    borderTopWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 12
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8
  },
  itemName: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "800"
  },
  emptyCart: {
    borderTopColor: colors.line,
    borderTopWidth: 1,
    paddingVertical: 16
  },
  modePill: {
    backgroundColor: colors.warningSoft,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5
  },
  modeText: {
    color: colors.orange,
    fontSize: 12,
    fontWeight: "900"
  },
  noWallet: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 10
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
  totalAmount: {
    color: colors.deepGreen,
    fontSize: 20,
    fontWeight: "900"
  },
  totalLabel: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "900"
  },
  totalLine: {
    alignItems: "center",
    borderTopColor: colors.line,
    borderTopWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12
  }
});
