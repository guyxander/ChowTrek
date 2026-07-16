import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

import { ModeChip } from "../components/ModeChip";
import { SectionHeader } from "../components/SectionHeader";
import { VendorCard } from "../components/VendorCard";
import { colors } from "../theme/colors";
import { sharedStyles } from "../theme/sharedStyles";
import { FulfilmentMode, Vendor } from "../types/domain";

type Props = {
  vendors: Vendor[];
  onToggleFollow: (vendorId: string) => void;
};

export function HomeScreen({ onToggleFollow, vendors }: Props) {
  const [query, setQuery] = useState("");
  const [selectedMode, setSelectedMode] = useState<FulfilmentMode | null>(null);
  const filteredVendors = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return vendors.filter((vendor) => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        vendor.name.toLowerCase().includes(normalizedQuery) ||
        vendor.category.toLowerCase().includes(normalizedQuery);
      const matchesMode = selectedMode ? vendor.deliveryModes.includes(selectedMode) : true;

      return matchesQuery && matchesMode;
    });
  }, [query, selectedMode, vendors]);

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
          onChangeText={setQuery}
          placeholder="Search food, shops, or vendors nearby"
          placeholderTextColor={colors.muted}
          style={styles.searchInput}
          value={query}
        />
      </View>
      <View style={styles.modeRow}>
        {[
          { icon: "walk" as const, label: "Trek Delivery" as const },
          { icon: "storefront" as const, label: "Pickup" as const },
          { icon: "bicycle" as const, label: "Express" as const }
        ].map((mode) => (
          <TouchableOpacity
            key={mode.label}
            onPress={() => setSelectedMode(selectedMode === mode.label ? null : mode.label)}
            style={selectedMode === mode.label ? styles.activeMode : null}
          >
            <ModeChip icon={mode.icon} label={mode.label} />
          </TouchableOpacity>
        ))}
      </View>
      <SectionHeader action="See all" title="Hidden Gems Nearby" />
      {filteredVendors.length > 0 ? (
        filteredVendors.map((vendor) => (
          <VendorCard key={vendor.id} onToggleFollow={onToggleFollow} vendor={vendor} />
        ))
      ) : (
        <View style={sharedStyles.card}>
          <Text style={sharedStyles.cardTitle}>No nearby matches</Text>
          <Text style={sharedStyles.bodyCopy}>Try another food, vendor, or delivery mode.</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  activeMode: {
    opacity: 0.72
  },
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
