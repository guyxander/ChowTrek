import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

import { BrandLogo } from "../components/BrandLogo";
import { ModeChip } from "../components/ModeChip";
import { SectionHeader } from "../components/SectionHeader";
import { VendorCard } from "../components/VendorCard";
import { VendorMenuPanel } from "../components/VendorMenuPanel";
import { colors } from "../theme/colors";
import { sharedStyles } from "../theme/sharedStyles";
import { FulfilmentMode, Product, Vendor } from "../types/domain";

type Props = {
  dataNotice: string;
  products: Product[];
  vendors: Vendor[];
  onAddToCart: (product: Product, vendor: Vendor) => void;
  onShowNotice: (message: string) => void;
  onToggleFollow: (vendorId: string) => void;
};

export function HomeScreen({
  dataNotice,
  onAddToCart,
  onShowNotice,
  onToggleFollow,
  products,
  vendors
}: Props) {
  const [query, setQuery] = useState("");
  const [selectedMode, setSelectedMode] = useState<FulfilmentMode | null>(null);
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null);
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
  const selectedVendor = filteredVendors.find((vendor) => vendor.id === selectedVendorId);
  const selectedVendorProducts = selectedVendor
    ? products.filter((product) => product.vendorId === selectedVendor.id)
    : [];

  const resetFilters = () => {
    setQuery("");
    setSelectedMode(null);
    setSelectedVendorId(null);
    onShowNotice("Showing all nearby merchants.");
  };

  return (
    <View style={styles.screen}>
      <View style={styles.fixedHeader}>
        <View style={styles.headerRow}>
          <View style={styles.brandLockup}>
            <BrandLogo size={46} />
            <View>
              <Text style={styles.brand}>ChowTrek</Text>
              <Text style={sharedStyles.subtle}>Around Lekki Phase 1</Text>
            </View>
          </View>
          <TouchableOpacity
            accessibilityLabel="Show notifications"
            onPress={() => onShowNotice("Notifications can be managed from your profile.")}
            style={styles.notificationButton}
          >
            <Ionicons color={colors.deepGreen} name="notifications-outline" size={26} />
          </TouchableOpacity>
        </View>
        <Text style={styles.dataNotice}>{dataNotice}</Text>
        <View style={styles.searchBox}>
          <Ionicons color={colors.muted} name="search" size={20} />
          <TextInput
            onChangeText={(value) => {
              setQuery(value);
              setSelectedVendorId(null);
            }}
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
              onPress={() => {
                setSelectedMode(selectedMode === mode.label ? null : mode.label);
                setSelectedVendorId(null);
              }}
              style={selectedMode === mode.label ? styles.activeMode : null}
            >
              <ModeChip icon={mode.icon} label={mode.label} />
            </TouchableOpacity>
          ))}
        </View>
      </View>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        style={styles.vendorScroll}
      >
        <SectionHeader action="See all" onAction={resetFilters} title="Hidden Gems Nearby" />
        {selectedVendor ? (
          <VendorMenuPanel
            onAddToCart={onAddToCart}
            onClose={() => setSelectedVendorId(null)}
            onToggleFollow={onToggleFollow}
            products={selectedVendorProducts}
            vendor={selectedVendor}
          />
        ) : null}
        {filteredVendors.length > 0 ? (
          filteredVendors.map((vendor) => (
            <VendorCard
              key={vendor.id}
              onPress={setSelectedVendorId}
              onToggleFollow={onToggleFollow}
              vendor={vendor}
            />
          ))
        ) : (
          <View style={sharedStyles.card}>
            <Text style={sharedStyles.cardTitle}>No nearby matches</Text>
            <Text style={sharedStyles.bodyCopy}>Try another food, vendor, or delivery mode.</Text>
          </View>
        )}
      </ScrollView>
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
  brandLockup: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10
  },
  headerRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16
  },
  dataNotice: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 12
  },
  fixedHeader: {
    flexShrink: 0
  },
  modeRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 22
  },
  notificationButton: {
    alignItems: "center",
    height: 44,
    justifyContent: "center",
    width: 44
  },
  screen: {
    flex: 1
  },
  scrollContent: {
    paddingBottom: 12
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
  },
  vendorScroll: {
    flex: 1
  }
});
