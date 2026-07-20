import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import {
  BackHandler,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";

import { BrandLogo } from "../components/BrandLogo";
import { StorefrontView } from "../components/StorefrontView";
import { VendorCard } from "../components/VendorCard";
import { colors } from "../theme/colors";
import { sharedStyles } from "../theme/sharedStyles";
import { CartItem, FulfilmentMode, Product, SavedAddress, Vendor } from "../types/domain";

const homeBanner = require("../../assets/chowtrek-home-banner.png");

const homeCategories = [
  "Favourites",
  "Near you",
  "Hidden gems",
  "Trek delivery",
  "Pick up",
  "Express"
] as const;
const fulfilmentFilters = ["All", "Trek Delivery", "Pickup", "Express"] as const;

type HomeCategory = (typeof homeCategories)[number];
type FulfilmentFilter = (typeof fulfilmentFilters)[number];

type Props = {
  addresses: SavedAddress[];
  cartItems: CartItem[];
  dataNotice: string;
  products: Product[];
  vendors: Vendor[];
  onAddToCart: (product: Product, vendor: Vendor) => void;
  onCreateAddress: () => void;
  onCartQuantityChange: (itemId: string, delta: number) => void;
  onOpenAddresses: () => void;
  onOpenCart: () => void;
  onOpenNotifications: () => void;
  onRefresh: () => void;
  onShowNotice: (message: string) => void;
  onToggleFollow: (vendorId: string) => void;
  refreshing: boolean;
};

export function HomeScreen({
  addresses,
  cartItems,
  dataNotice,
  onAddToCart,
  onCreateAddress,
  onCartQuantityChange,
  onOpenAddresses,
  onOpenCart,
  onOpenNotifications,
  onRefresh,
  onShowNotice,
  onToggleFollow,
  products,
  refreshing,
  vendors
}: Props) {
  const [activeCategory, setActiveCategory] = useState<HomeCategory>("Hidden gems");
  const [selectedMode, setSelectedMode] = useState<FulfilmentFilter>("All");
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null);
  const [selectedAddressId, setSelectedAddressId] = useState(addresses[0]?.id ?? "");
  const [filterOpen, setFilterOpen] = useState(false);
  const selectedAddress = addresses.find((address) => address.id === selectedAddressId) ?? addresses[0];

  useEffect(() => {
    if (!addresses.some((address) => address.id === selectedAddressId)) {
      setSelectedAddressId(addresses[0]?.id ?? "");
    }
  }, [addresses, selectedAddressId]);

  const addressVendors = useMemo(
    () =>
      vendors
        .map((vendor, index) => ({
          ...vendor,
          distanceKm: Number(
            (vendor.distanceKm + selectedAddress.distanceBiasKm + index * 0.1).toFixed(1)
          ),
          etaMinutes: vendor.etaMinutes + Math.round(selectedAddress.distanceBiasKm * 4)
        }))
        .sort((left, right) => left.distanceKm - right.distanceKm),
    [selectedAddress, vendors]
  );

  const filteredVendors = useMemo(() => {
    const categoryMode = getCategoryFulfilmentMode(activeCategory);
    const activeMode = categoryMode ?? (selectedMode === "All" ? null : selectedMode);

    return addressVendors.filter((vendor) => {
      const matchesCategory =
        activeCategory === "Favourites"
          ? vendor.followed
          : activeCategory === "Near you"
            ? vendor.distanceKm <= 2.5
            : true;
      const matchesMode = activeMode ? vendor.deliveryModes.includes(activeMode) : true;

      return matchesCategory && matchesMode;
    });
  }, [activeCategory, addressVendors, selectedMode]);

  const selectedVendor = filteredVendors.find((vendor) => vendor.id === selectedVendorId);
  const selectedVendorProducts = selectedVendor
    ? products.filter((product) => product.vendorId === selectedVendor.id)
    : [];

  useEffect(() => {
    if (!selectedVendorId) {
      return undefined;
    }

    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      setSelectedVendorId(null);
      return true;
    });

    return () => subscription.remove();
  }, [selectedVendorId]);

  if (selectedVendor) {
    return (
      <StorefrontView
        cartItems={cartItems}
        onAddToCart={onAddToCart}
        onBack={() => setSelectedVendorId(null)}
        onCartQuantityChange={onCartQuantityChange}
        onOpenCart={onOpenCart}
        onRefresh={onRefresh}
        onToggleFollow={onToggleFollow}
        products={selectedVendorProducts}
        refreshing={refreshing}
        vendor={selectedVendor}
      />
    );
  }

  const resetFilters = () => {
    setActiveCategory("Hidden gems");
    setSelectedMode("All");
    setSelectedVendorId(null);
    onShowNotice("Showing all nearby merchants.");
  };

  const selectFulfilmentFilter = (mode: FulfilmentFilter) => {
    setSelectedMode(mode);
    setFilterOpen(false);
    setSelectedVendorId(null);

    if (mode === "All") {
      setActiveCategory("Hidden gems");
      onShowNotice("Showing all nearby merchants.");
      return;
    }

    setActiveCategory(
      mode === "Pickup" ? "Pick up" : mode === "Trek Delivery" ? "Trek delivery" : "Express"
    );
    onShowNotice(`Showing merchants with ${mode}.`);
  };

  return (
    <View style={styles.screen}>
      <FilterModal
        onClose={() => setFilterOpen(false)}
        onSelect={selectFulfilmentFilter}
        selectedMode={selectedMode}
        visible={filterOpen}
      />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            colors={[colors.deepGreen]}
            onRefresh={onRefresh}
            refreshing={refreshing}
            tintColor={colors.deepGreen}
          />
        }
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[1]}
      >
        <View>
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
              onPress={onOpenNotifications}
              style={styles.notificationButton}
            >
              <Ionicons color={colors.deepGreen} name="notifications-outline" size={26} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.stickyAddressWrap}>
          <View style={styles.addressCard}>
            <TouchableOpacity onPress={onOpenAddresses} style={styles.addressMain}>
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
                    <Text
                      style={[styles.addressChipText, active ? styles.addressChipTextActive : null]}
                    >
                      {address.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
              <TouchableOpacity onPress={onCreateAddress} style={styles.addAddressChip}>
                <Ionicons color={colors.deepGreen} name="add" size={15} />
                <Text style={styles.addAddressText}>Add address</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>

        <Text style={styles.dataNotice}>{dataNotice}</Text>

        <View style={styles.bannerCard}>
          <Image source={homeBanner} style={styles.bannerImage} />
        </View>

        <ScrollView
          contentContainerStyle={styles.categoryList}
          horizontal
          showsHorizontalScrollIndicator={false}
        >
          {homeCategories.map((category) => {
            const isActive = activeCategory === category;

            return (
              <TouchableOpacity
                key={category}
                onPress={() => {
                  setActiveCategory(category);
                  setSelectedVendorId(null);
                  const categoryMode = getCategoryFulfilmentMode(category);

                  if (categoryMode) {
                    setSelectedMode(categoryMode);
                  }
                }}
                style={[styles.categoryChip, isActive ? styles.categoryChipActive : null]}
              >
                <Text style={[styles.categoryText, isActive ? styles.categoryTextActive : null]}>
                  {category}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={styles.feedHeader}>
          <View style={styles.feedCopy}>
            <Text style={styles.feedTitle}>Restaurants close to you</Text>
            <Text style={styles.feedMeta}>{getFeedSubtitle(activeCategory, selectedMode)}</Text>
          </View>
          <TouchableOpacity onPress={() => setFilterOpen(true)} style={styles.filterButton}>
            <Ionicons color={colors.deepGreen} name="options-outline" size={18} />
            <Text numberOfLines={1} style={styles.filterText}>
              {selectedMode === "All" ? "Filter" : selectedMode}
            </Text>
          </TouchableOpacity>
        </View>

        {filteredVendors.length > 0 ? (
          <>
            {filteredVendors.map((vendor) => (
              <VendorCard
                key={vendor.id}
                onPress={setSelectedVendorId}
                onToggleFollow={onToggleFollow}
                vendor={vendor}
              />
            ))}
            <TouchableOpacity onPress={resetFilters} style={styles.feedEndButton}>
              <Ionicons color={colors.deepGreen} name="infinite-outline" size={18} />
              <Text style={styles.feedEndText}>Keep exploring nearby restaurants</Text>
            </TouchableOpacity>
          </>
        ) : (
          <View style={sharedStyles.card}>
            <Text style={sharedStyles.cardTitle}>No nearby matches</Text>
            <Text style={sharedStyles.bodyCopy}>Try another category or delivery filter.</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function FilterModal({
  onClose,
  onSelect,
  selectedMode,
  visible
}: {
  onClose: () => void;
  onSelect: (mode: FulfilmentFilter) => void;
  selectedMode: FulfilmentFilter;
  visible: boolean;
}) {
  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible={visible}>
      <TouchableOpacity activeOpacity={1} onPress={onClose} style={styles.modalBackdrop}>
        <View style={styles.filterSheet}>
          <View style={styles.filterSheetHeader}>
            <Text style={styles.filterTitle}>Delivery filter</Text>
            <TouchableOpacity accessibilityLabel="Close filter" onPress={onClose}>
              <Ionicons color={colors.muted} name="close" size={22} />
            </TouchableOpacity>
          </View>
          {fulfilmentFilters.map((mode) => {
            const isActive = selectedMode === mode;

            return (
              <TouchableOpacity
                key={mode}
                onPress={() => onSelect(mode)}
                style={[styles.filterOption, isActive ? styles.filterOptionActive : null]}
              >
                <Ionicons
                  color={isActive ? "#ffffff" : colors.deepGreen}
                  name={getFilterIcon(mode)}
                  size={19}
                />
                <Text
                  style={[
                    styles.filterOptionText,
                    isActive ? styles.filterOptionTextActive : null
                  ]}
                >
                  {mode === "All" ? "All restaurants" : mode}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

function getCategoryFulfilmentMode(category: HomeCategory): FulfilmentMode | null {
  if (category === "Trek delivery") {
    return "Trek Delivery";
  }

  if (category === "Pick up") {
    return "Pickup";
  }

  if (category === "Express") {
    return "Express";
  }

  return null;
}

function getFeedSubtitle(category: HomeCategory, selectedMode: FulfilmentFilter): string {
  if (category === "Favourites") {
    return "Restaurants you already follow";
  }

  if (category === "Near you") {
    return "Closest vendors for this address";
  }

  const categoryMode = getCategoryFulfilmentMode(category);
  const mode = categoryMode ?? (selectedMode === "All" ? null : selectedMode);

  return mode ? `Showing ${mode} options` : "Hidden gems around your address";
}

function getFilterIcon(mode: FulfilmentFilter): keyof typeof Ionicons.glyphMap {
  if (mode === "Trek Delivery") {
    return "walk";
  }

  if (mode === "Pickup") {
    return "storefront-outline";
  }

  if (mode === "Express") {
    return "bicycle-outline";
  }

  return "restaurant-outline";
}

const styles = StyleSheet.create({
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
  bannerCard: {
    borderRadius: 14,
    marginBottom: 18,
    overflow: "hidden"
  },
  bannerImage: {
    height: 132,
    resizeMode: "cover",
    width: "100%"
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
  categoryChip: {
    alignItems: "center",
    backgroundColor: colors.card,
    borderColor: colors.line,
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 40,
    paddingHorizontal: 14
  },
  categoryChipActive: {
    backgroundColor: colors.deepGreen,
    borderColor: colors.deepGreen
  },
  categoryList: {
    gap: 8,
    marginBottom: 18,
    paddingRight: 8
  },
  categoryText: {
    color: colors.deepGreen,
    fontSize: 12,
    fontWeight: "900"
  },
  categoryTextActive: {
    color: "#ffffff"
  },
  dataNotice: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 12,
    marginTop: 2
  },
  feedCopy: {
    flex: 1,
    paddingRight: 10
  },
  feedEndButton: {
    alignItems: "center",
    backgroundColor: colors.successSoft,
    borderRadius: 12,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    marginBottom: 12,
    paddingVertical: 14
  },
  feedEndText: {
    color: colors.deepGreen,
    fontSize: 13,
    fontWeight: "900"
  },
  feedHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12
  },
  feedMeta: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 3
  },
  feedTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "900"
  },
  filterButton: {
    alignItems: "center",
    backgroundColor: colors.card,
    borderColor: colors.line,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 6,
    maxWidth: 142,
    minHeight: 40,
    paddingHorizontal: 12
  },
  filterOption: {
    alignItems: "center",
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 12,
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 13
  },
  filterOptionActive: {
    backgroundColor: colors.deepGreen
  },
  filterOptionText: {
    color: colors.text,
    flex: 1,
    fontSize: 14,
    fontWeight: "900"
  },
  filterOptionTextActive: {
    color: "#ffffff"
  },
  filterSheet: {
    backgroundColor: colors.card,
    borderRadius: 14,
    marginHorizontal: 16,
    padding: 16
  },
  filterSheetHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 2
  },
  filterText: {
    color: colors.deepGreen,
    flexShrink: 1,
    fontSize: 12,
    fontWeight: "900"
  },
  filterTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "900"
  },
  headerRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16
  },
  modalBackdrop: {
    backgroundColor: "rgba(0, 0, 0, 0.38)",
    flex: 1,
    justifyContent: "flex-end",
    paddingBottom: 22
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
  stickyAddressWrap: {
    backgroundColor: colors.surface,
    elevation: 4,
    paddingBottom: 12,
    paddingTop: 2,
    zIndex: 10
  }
});
