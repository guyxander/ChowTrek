import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TextInput, View } from "react-native";

import { ModeChip } from "../components/ModeChip";
import { SectionHeader } from "../components/SectionHeader";
import { VendorCard } from "../components/VendorCard";
import { colors } from "../theme/colors";
import { sharedStyles } from "../theme/sharedStyles";
import { Vendor } from "../types/domain";

type Props = {
  vendors: Vendor[];
  onToggleFollow: (vendorId: string) => void;
};

export function HomeScreen({ onToggleFollow, vendors }: Props) {

  return (
    <View>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.brand}>ChowTrek</Text>
          <Text style={sharedStyles.subtle}>Around Lekki Phase 1</Text>
        </View>
        <Ionicons color={colors.deepGreen} name="notifications-outline" size={26} />
      </View>
      <View style={styles.searchBox}>
        <Ionicons color={colors.muted} name="search" size={20} />
        <TextInput
          placeholder="Search food, shops, or vendors nearby"
          placeholderTextColor={colors.muted}
          style={styles.searchInput}
        />
      </View>
      <View style={styles.modeRow}>
        <ModeChip icon="walk" label="Trek Delivery" />
        <ModeChip icon="storefront" label="Pickup" />
        <ModeChip icon="bicycle" label="Express" />
      </View>
      <SectionHeader action="See all" title="Hidden Gems Nearby" />
      {vendors.map((vendor) => (
        <VendorCard key={vendor.id} onToggleFollow={onToggleFollow} vendor={vendor} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  brand: {
    color: colors.text,
    fontSize: 28,
    fontWeight: "800"
  },
  headerRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16
  },
  modeRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 22
  },
  searchBox: {
    alignItems: "center",
    backgroundColor: "#eef2ff",
    borderRadius: 999,
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
    paddingHorizontal: 14
  },
  searchInput: {
    color: colors.text,
    flex: 1,
    fontSize: 14,
    paddingVertical: 13
  }
});
