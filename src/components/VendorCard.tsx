import { Ionicons } from "@expo/vector-icons";
import { GestureResponderEvent, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { colors } from "../theme/colors";
import { sharedStyles } from "../theme/sharedStyles";
import { Vendor } from "../types/domain";
import { StatusBadge } from "./StatusBadge";

type Props = {
  vendor: Vendor;
  onPress?: (vendorId: string) => void;
  onToggleFollow?: (vendorId: string) => void;
};

export function VendorCard({ onPress, onToggleFollow, vendor }: Props) {
  const formattedDistance =
    Number.isInteger(vendor.distanceKm) ? `${vendor.distanceKm}` : vendor.distanceKm.toFixed(1);

  const handleFollowPress = (event: GestureResponderEvent) => {
    event.stopPropagation();
    onToggleFollow?.(vendor.id);
  };

  return (
    <TouchableOpacity
      activeOpacity={onPress ? 0.82 : 1}
      disabled={!onPress}
      onPress={() => onPress?.(vendor.id)}
      style={styles.vendorCard}
    >
      <View style={[styles.vendorHero, { backgroundColor: vendor.color }]}>
        <StatusBadge status={vendor.status} />
        <Text style={styles.vendorHeroText}>{vendor.name}</Text>
      </View>
      <View style={styles.vendorBody}>
        <Text style={sharedStyles.cardTitle}>{vendor.category}</Text>
        <View style={sharedStyles.inlineMeta}>
          <Ionicons color={colors.orange} name="star" size={18} />
          <Text style={sharedStyles.metaText}>{vendor.rating}</Text>
          <Ionicons color={colors.deepGreen} name="navigate-outline" size={18} />
          <Text style={sharedStyles.metaText}>{formattedDistance} km</Text>
          <Text style={styles.totalText}>{vendor.etaMinutes} min</Text>
        </View>
        <View style={styles.followLine}>
          <Text style={styles.followCount}>{vendor.followers.toLocaleString("en-NG")} followers</Text>
          {onToggleFollow ? (
            <TouchableOpacity onPress={handleFollowPress} style={styles.followButton}>
              <Ionicons
                color={vendor.followed ? colors.orange : colors.deepGreen}
                name={vendor.followed ? "heart" : "heart-outline"}
                size={17}
              />
              <Text style={styles.followButtonText}>{vendor.followed ? "Following" : "Follow"}</Text>
            </TouchableOpacity>
          ) : null}
        </View>
        <View style={styles.modeLine}>
          {vendor.deliveryModes.map((mode) => (
            <Text key={mode} style={styles.modeText}>
              {mode}
            </Text>
          ))}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  followButton: {
    alignItems: "center",
    borderColor: colors.line,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  followButtonText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "900"
  },
  followCount: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700"
  },
  followLine: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12
  },
  modeLine: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12
  },
  modeText: {
    backgroundColor: colors.successSoft,
    borderRadius: 999,
    color: colors.greenContainer,
    fontSize: 12,
    fontWeight: "800",
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  totalText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "800",
    marginLeft: "auto"
  },
  vendorBody: {
    padding: 16
  },
  vendorCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    marginBottom: 16,
    overflow: "hidden"
  },
  vendorHero: {
    alignItems: "flex-start",
    height: 170,
    justifyContent: "space-between",
    padding: 14
  },
  vendorHeroText: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "900"
  }
});
