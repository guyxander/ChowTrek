import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { colors } from "../theme/colors";
import { sharedStyles } from "../theme/sharedStyles";
import { Order } from "../types/domain";
import { formatNaira } from "../utils/money";
import { OrderProgress } from "./OrderProgress";

type Props = {
  order: Order;
};

export function OrderCard({ order }: Props) {
  return (
    <View style={sharedStyles.card}>
      <View style={styles.cardHeader}>
        <Text style={sharedStyles.cardTitle}>Order #{order.id}</Text>
        <View style={styles.orderPill}>
          <Text style={styles.orderPillText}>{order.status}</Text>
        </View>
      </View>
      <Text style={sharedStyles.bodyCopy}>{order.vendor}</Text>
      <Text style={sharedStyles.bodyCopy}>{order.summary}</Text>
      {order.paymentMode || order.paymentStatus ? (
        <View style={styles.paymentLine}>
          <Ionicons color={colors.deepGreen} name="card-outline" size={17} />
          <Text style={styles.paymentText}>
            {order.paymentMode ?? "Payment"} - {order.paymentStatus ?? "Pending"}
          </Text>
        </View>
      ) : null}
      {order.paymentReference ? (
        <Text style={styles.referenceText}>Ref: {order.paymentReference}</Text>
      ) : null}
      <View style={sharedStyles.inlineMeta}>
        <Ionicons color={colors.deepGreen} name="location-outline" size={18} />
        <Text style={sharedStyles.metaText}>{order.etaMinutes} min ETA</Text>
        <Text style={styles.totalText}>{formatNaira(order.totalNaira)}</Text>
      </View>
      {order.receiptLines?.length ? (
        <View style={styles.receiptBox}>
          <Text style={styles.receiptTitle}>Receipt</Text>
          {order.receiptLines.map((line) => (
            <Text key={line} style={styles.receiptLine}>
              {line}
            </Text>
          ))}
        </View>
      ) : null}
      <OrderProgress status={order.status} />
    </View>
  );
}

const styles = StyleSheet.create({
  cardHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    justifyContent: "space-between",
    marginBottom: 8
  },
  orderPill: {
    backgroundColor: colors.deepGreen,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5
  },
  orderPillText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "800"
  },
  paymentLine: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
    marginTop: 8
  },
  paymentText: {
    color: colors.deepGreen,
    fontSize: 13,
    fontWeight: "900"
  },
  receiptBox: {
    backgroundColor: colors.successSoft,
    borderRadius: 8,
    marginTop: 12,
    padding: 12
  },
  receiptLine: {
    color: colors.greenContainer,
    fontSize: 12,
    marginTop: 4
  },
  receiptTitle: {
    color: colors.greenContainer,
    fontSize: 13,
    fontWeight: "900"
  },
  referenceText: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 4
  },
  totalText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "800",
    marginLeft: "auto"
  }
});
