import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

import { BrandLogo } from "../components/BrandLogo";
import { ModeChip } from "../components/ModeChip";
import { SectionHeader } from "../components/SectionHeader";
import { StorefrontView } from "../components/StorefrontView";
import { VendorCard } from "../components/VendorCard";
import { colors } from "../theme/colors";
import { sharedStyles } from "../theme/sharedStyles";
import { CartItem, FulfilmentMode, Product, SavedAddress, Vendor } from "../types/domain";

type Props = {
  cartItems: CartItem[];
  dataNotice: string;
  products: Product[];
  vendors: Vendor[];
  onAddToCart: (product: Product, vendor: Vendor) => void;
  onCartQuantityChange: (itemId: string, delta: number) => void;
  onOpenCart: () => void;
  onShowNotice: (message: string) => void;
  onToggleFollow: (vendorId: string) => void;
};

const savedAddresses: SavedAddress[] = [
  {
    id: "lekki-home",
    label: "Home",
    detail: "Lekki Phase 1",
    area: "Around Lekki Phase 1",
    distanceBiasKm: 0
  },
  {
    id: "vi-office",
    label: "Work",
    detail: "Victoria Island",
    area: "Around Victoria Island",
    distanceBiasKm: 1.1
  }
];

export function HomeScreen({
  cartItems,
  dataNotice,
  onAddToCart,
  onCartQuantityChange,
  onOpenCart,
  onShowNotice,
  onToggleFollow,
  products,
  vendors
}: Props) {
  const [query, setQuery] = useState("");
  const [selectedMode, setSelectedMode] = useState<FulfilmentMode | null>(null);
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null);
  const [addresses, setAddresses] = useState(savedAddresses);
  const [selectedAddressId, setSelectedAddressId] = useState(savedAddresses[0].id);
  const selectedAddress = addresses.find((address) => address.id === selectedAddressId) ?? addresses[0];
  const addressVendors = useMemo(
    () =>
      vendors
        .map((vendor, index) => ({
          ...vendor,
          distanceKm: Number((vendor.distanceKm + selectedAddress.distanceBiasKm + index * 0.1).toFixed(1)),
          etaMinutes: vendor.etaMinutes + Math.round(selectedAddress.distanceBiasKm * 4)
        }))
        .sort((left, right) => left.distanceKm - right.distanceKm),
    [selectedAddress, vendors]
  );
  const filteredVendors = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return addressVendors.filter((vendor) => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        vendor.name.toLowerCase().includes(normalizedQuery) ||
        vendor.category.toLowerCase().includes(normalizedQuery);
      const matchesMode = selectedMode ? vendor.deliveryModes.includes(selectedMode) : true;

      return matchesQuery && matchesMode;
    });
  }, [addressVendors, query, selectedMode]);
  const selectedVendor = filteredVendors.find((vendor) => vendor.id === selectedVendorId);
  const selectedVendorProducts = selectedVendor
    ? products.filter((product) => product.vendorId === selectedVendor.id)
    : [];

  if (selectedVendor) {
    return (
      <StorefrontView
        cartItems={cartItems}
        onAddToCart={onAddToCart}
        onBack={() => setSelectedVendorId(null)}
        onCartQuantityChange={onCartQuantityChange}
        onOpenCart={onOpenCart}
        onToggleFollow={onToggleFollow}
        products={selectedVendorProducts}
        vendor={selectedVendor}
      />
    );
  }

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
              <Text style={sharedStyles.subtle}>{selectedAddress.area}</Text>
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
        <View style={styles.addressCard}>
          <TouchableOpacity
            onPress={() => onShowNotice("Saved addresses are ready for Supabase address management.")}
            style={styles.addressMain}
          >
            <Ionicons color={colors.deepGreen} name="location" size={19} />
            <View style={styles.addressCopy}>
              <Text style={styles.addressLabel}>Delivering to {selectedAddress.label}</Text>
              <Text numberOfLines={1} style={styles.addressDetail}>
                {selectedAddress.detail}
              </Text>
            </View>
            <Ionicons color={colors.muted} name="chevron-down" size={18} />
          </TouchableOpacity>
          <ScrollView
            contentContainerStyle={styles.addressChips}
            horizontal
            showsHorizontalScrollIndicator={false}
          >
            {addresses.map((address) => {
              const active = selectedAddressId === address.id;

              return (
                <TouchableOpacity
                  key={address.id}
                  onPress={() => {
                    setSelectedAddressId(address.id);
                    setSelectedVendorId(null);
                    onShowNotice(`Showing Food Ready merchants near ${address.detail}.`);
                  }}
                  style={[styles.addressChip, active ? styles.addressChipActive : null]}
                >
                  <Text style={[styles.addressChipText, active ? styles.addressChipTextActive : null]}>
                    {address.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
            <TouchableOpacity
              onPress={() => {
                const newAddress: SavedAddress = {
                  id: `address-${Date.now()}`,
                  label: "New",
                  detail: "New saved address",
                  area: "Around your new address",
                  distanceBiasKm: 0.6
                };
                setAddresses((currentAddresses) => [...currentAddresses, newAddress]);
                setSelectedAddressId(newAddress.id);
                setSelectedVendorId(null);
                onShowNotice("New address slot added. Connect Supabase address saving to persist it.");
              }}
              style={styles.addAddressChip}
            >
              <Ionicons color={colors.deepGreen} name="add" size={15} />
              <Text style={styles.addAddressText}>Add address</Text>
            </TouchableOpacity>
          </ScrollView>
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
  addAddressChip: {
    alignItems: "center",
    backgroundColor: colors.successSoft,
    borderRadius: 999,
    flexDirection: "row",
    gap: 4,
    paddingHorizontal: 11,
    paddingVertical: 8
  },
  addAddressText: {
    color: colors.deepGreen,
    fontSize: 12,
    fontWeight: "900"
  },
  addressCard: {
    backgroundColor: colors.card,
    borderColor: "rgba(191, 201, 195, 0.28)",
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 12,
    padding: 12
  },
  addressChip: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  addressChipActive: {
    backgroundColor: colors.deepGreen
  },
  addressChips: {
    gap: 8,
    paddingTop: 10
  },
  addressChipText: {
    color: colors.deepGreen,
    fontSize: 12,
    fontWeight: "900"
  },
  addressChipTextActive: {
    color: "#ffffff"
  },
  addressCopy: {
    flex: 1
  },
  addressDetail: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "900",
    marginTop: 2
  },
  addressLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  addressMain: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10
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
