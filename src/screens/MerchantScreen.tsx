import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { SectionHeader } from "../components/SectionHeader";
import { StatusBadge } from "../components/StatusBadge";
import { commerceRepository } from "../repositories/commerceRepository";
import { colors } from "../theme/colors";
import { sharedStyles } from "../theme/sharedStyles";
import { Order, Product } from "../types/domain";
import { formatNaira } from "../utils/money";

type Props = {
  onBack: () => void;
  orders: Order[];
  products: Product[];
  onCycleProductStatus: (productId: string) => void;
};

export function MerchantScreen({ onBack, onCycleProductStatus, orders, products }: Props) {
  const metrics = commerceRepository.getMerchantMetrics();

  return (
    <View>
      <TouchableOpacity onPress={onBack} style={styles.backButton}>
        <Ionicons color={colors.deepGreen} name="chevron-back" size={20} />
        <Text style={styles.backText}>Profile</Text>
      </TouchableOpacity>
      <Text style={sharedStyles.screenTitle}>Merchant</Text>
      <Text style={sharedStyles.bodyCopy}>
        Dashboard preview for Mama Put&apos;s Kitchen: availability, products, queue, handover,
        and analytics.
      </Text>
      <View style={styles.metricGrid}>
        {metrics.map((metric) => (
          <View key={metric.label} style={styles.metricCard}>
            <Text style={styles.metricValue}>{metric.value}</Text>
            <Text style={sharedStyles.subtle}>{metric.label}</Text>
          </View>
        ))}
      </View>
      <SectionHeader title="Product availability" />
      {products.map((product) => (
        <View key={product.id} style={sharedStyles.card}>
          <View style={styles.row}>
            <View>
              <Text style={sharedStyles.cardTitle}>{product.name}</Text>
              <Text style={sharedStyles.bodyCopy}>{formatNaira(product.priceNaira)}</Text>
            </View>
            <StatusBadge status={product.status} />
          </View>
          <TouchableOpacity
            onPress={() => onCycleProductStatus(product.id)}
            style={styles.statusButton}
          >
            <Text style={styles.statusButtonText}>Change status</Text>
          </TouchableOpacity>
        </View>
      ))}
      <SectionHeader title="Order queue" />
      {orders.map((order) => (
        <View key={order.id} style={sharedStyles.card}>
          <View style={styles.row}>
            <View>
              <Text style={sharedStyles.cardTitle}>Order #{order.id}</Text>
              <Text style={sharedStyles.bodyCopy}>{order.summary}</Text>
            </View>
            <Text style={styles.queueStatus}>{order.status}</Text>
          </View>
          <View style={styles.actionRow}>
            <Text style={styles.queueAction}>Accept</Text>
            <Text style={styles.queueAction}>Mark ready</Text>
            <Text style={styles.queueAction}>Handover</Text>
          </View>
        </View>
      ))}
      <View style={sharedStyles.card}>
        <View style={sharedStyles.inlineMeta}>
          <Ionicons color={colors.orange} name="megaphone-outline" size={20} />
          <Text style={sharedStyles.metaText}>Create Food Ready, New Product, or Community post</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  metricCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    flex: 1,
    padding: 14
  },
  backButton: {
    alignItems: "center",
    alignSelf: "flex-start",
    flexDirection: "row",
    gap: 4,
    marginBottom: 12,
    paddingVertical: 4
  },
  backText: {
    color: colors.deepGreen,
    fontSize: 14,
    fontWeight: "800"
  },
  metricGrid: {
    flexDirection: "row",
    gap: 10,
    marginVertical: 18
  },
  metricValue: {
    color: colors.deepGreen,
    fontSize: 22,
    fontWeight: "900"
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  actionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 14
  },
  queueAction: {
    backgroundColor: colors.successSoft,
    borderRadius: 999,
    color: colors.greenContainer,
    fontSize: 12,
    fontWeight: "900",
    paddingHorizontal: 10,
    paddingVertical: 7
  },
  queueStatus: {
    backgroundColor: colors.warningSoft,
    borderRadius: 999,
    color: colors.orange,
    fontSize: 12,
    fontWeight: "900",
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  statusButton: {
    alignItems: "center",
    borderColor: colors.deepGreen,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 12,
    paddingVertical: 10
  },
  statusButtonText: {
    color: colors.deepGreen,
    fontSize: 13,
    fontWeight: "900"
  }
});
