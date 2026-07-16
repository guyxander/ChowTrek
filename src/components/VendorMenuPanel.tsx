import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { colors } from "../theme/colors";
import { sharedStyles } from "../theme/sharedStyles";
import { Product, Vendor } from "../types/domain";
import { StatusBadge } from "./StatusBadge";

type Props = {
  products: Product[];
  vendor: Vendor;
  onAddToCart: (product: Product, vendor: Vendor) => void;
  onClose: () => void;
  onToggleFollow: (vendorId: string) => void;
};

export function VendorMenuPanel({
  onAddToCart,
  onClose,
  onToggleFollow,
  products,
  vendor
}: Props) {
  return (
    <View style={styles.panel}>
      <View style={styles.headerRow}>
        <View style={styles.titleColumn}>
          <Text style={styles.kicker}>Now viewing</Text>
          <Text style={styles.title}>{vendor.name}</Text>
          <View style={sharedStyles.inlineMeta}>
            <Ionicons color={colors.orange} name="star" size={17} />
            <Text style={sharedStyles.metaText}>{vendor.rating}</Text>
            <Ionicons color={colors.deepGreen} name="navigate-outline" size={17} />
            <Text style={sharedStyles.metaText}>{vendor.distanceKm} km</Text>
            <StatusBadge status={vendor.status} />
          </View>
        </View>
        <TouchableOpacity accessibilityLabel="Close merchant details" onPress={onClose} style={styles.iconButton}>
          <Ionicons color={colors.text} name="close" size={20} />
        </TouchableOpacity>
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity onPress={() => onToggleFollow(vendor.id)} style={styles.secondaryButton}>
          <Ionicons
            color={vendor.followed ? colors.orange : colors.deepGreen}
            name={vendor.followed ? "heart" : "heart-outline"}
            size={17}
          />
          <Text style={styles.secondaryButtonText}>{vendor.followed ? "Following" : "Follow"}</Text>
        </TouchableOpacity>
        <View style={styles.etaPill}>
          <Ionicons color={colors.deepGreen} name="time-outline" size={17} />
          <Text style={styles.etaText}>{vendor.etaMinutes} min ETA</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Menu</Text>
      {products.length > 0 ? (
        products.map((product) => (
          <View key={product.id} style={styles.productRow}>
            <View style={styles.productInfo}>
              <Text style={styles.productName}>{product.name}</Text>
              <Text style={styles.productMeta}>
                ₦{product.priceNaira.toLocaleString("en-NG")} · {product.status}
              </Text>
            </View>
            <TouchableOpacity
              disabled={product.status === "Sold Out"}
              onPress={() => onAddToCart(product, vendor)}
              style={[
                styles.addButton,
                product.status === "Sold Out" ? styles.addButtonDisabled : null
              ]}
            >
              <Ionicons color="#ffffff" name="add" size={18} />
              <Text style={styles.addButtonText}>
                {product.status === "Sold Out" ? "Sold out" : "Add"}
              </Text>
            </TouchableOpacity>
          </View>
        ))
      ) : (
        <View style={styles.emptyProducts}>
          <Text style={sharedStyles.cardTitle}>No menu items yet</Text>
          <Text style={sharedStyles.bodyCopy}>
            This merchant is live, but has not published products in Supabase yet.
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  actionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 14
  },
  addButton: {
    alignItems: "center",
    backgroundColor: colors.deepGreen,
    borderRadius: 999,
    flexDirection: "row",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  addButtonDisabled: {
    backgroundColor: colors.muted
  },
  addButtonText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "900"
  },
  emptyProducts: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 10,
    padding: 14
  },
  etaPill: {
    alignItems: "center",
    backgroundColor: colors.successSoft,
    borderRadius: 999,
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9
  },
  etaText: {
    color: colors.greenContainer,
    fontSize: 12,
    fontWeight: "900"
  },
  headerRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between"
  },
  iconButton: {
    alignItems: "center",
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 999,
    height: 36,
    justifyContent: "center",
    width: 36
  },
  kicker: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase"
  },
  panel: {
    backgroundColor: colors.card,
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    padding: 16
  },
  productInfo: {
    flex: 1
  },
  productMeta: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 4
  },
  productName: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "900"
  },
  productRow: {
    alignItems: "center",
    borderTopColor: colors.line,
    borderTopWidth: 1,
    flexDirection: "row",
    gap: 12,
    paddingVertical: 12
  },
  secondaryButton: {
    alignItems: "center",
    borderColor: colors.line,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9
  },
  secondaryButtonText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "900"
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "900",
    marginBottom: 2,
    marginTop: 16
  },
  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "900"
  },
  titleColumn: {
    flex: 1
  }
});
