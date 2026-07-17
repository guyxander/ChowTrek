import { useEffect, useMemo, useState } from "react";
import {
  BackHandler,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";

import { StorefrontView } from "../components/StorefrontView";
import { TimelineCard } from "../components/TimelineCard";
import { VendorCard } from "../components/VendorCard";
import { colors } from "../theme/colors";
import { sharedStyles } from "../theme/sharedStyles";
import { CartItem, Product, TimelineEvent, Vendor } from "../types/domain";

const filters = ["Food Ready Near You", "New Products", "Special Offers", "Following"];

type Props = {
  cartItems: CartItem[];
  dataNotice: string;
  products: Product[];
  vendors: Vendor[];
  timelineEvents: TimelineEvent[];
  onAddToCart: (product: Product, vendor: Vendor) => void;
  onCartQuantityChange: (itemId: string, delta: number) => void;
  onOpenCart: () => void;
  onToggleFollow: (vendorId: string) => void;
};

export function DiscoverScreen({
  cartItems,
  dataNotice,
  onAddToCart,
  onCartQuantityChange,
  onOpenCart,
  onToggleFollow,
  products,
  timelineEvents,
  vendors
}: Props) {
  const [query, setQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState(filters[0]);
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null);
  const filteredVendors = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return vendors.filter((vendor) => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        vendor.name.toLowerCase().includes(normalizedQuery) ||
        vendor.category.toLowerCase().includes(normalizedQuery);
      const matchesFilter =
        selectedFilter === "Following"
          ? vendor.followed
          : selectedFilter === "Food Ready Near You"
            ? vendor.status === "Food Ready"
            : true;

      return matchesQuery && matchesFilter;
    });
  }, [query, selectedFilter, vendors]);
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
        onToggleFollow={onToggleFollow}
        products={selectedVendorProducts}
        vendor={selectedVendor}
      />
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[1]}
      >
        <View>
          <Text style={sharedStyles.screenTitle}>Discover</Text>
          <Text style={sharedStyles.bodyCopy}>
            Food ready, new products, special offers, and followed vendor updates.
          </Text>
          <Text style={styles.dataNotice}>{dataNotice}</Text>
        </View>
        <View style={styles.stickySearchWrap}>
          <TextInput
            onChangeText={(value) => {
              setQuery(value);
              setSelectedVendorId(null);
            }}
            placeholder="Search vendors, food, or offers"
            placeholderTextColor={colors.muted}
            style={styles.searchInput}
            value={query}
          />
        </View>
        <View style={styles.filterRow}>
          {filters.map((label) => (
            <TouchableOpacity
              key={label}
              onPress={() => {
                setSelectedFilter(label);
                setSelectedVendorId(null);
              }}
              style={[styles.filterChip, selectedFilter === label ? styles.filterChipActive : null]}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedFilter === label ? styles.filterChipTextActive : null
                ]}
              >
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
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
            <Text style={sharedStyles.cardTitle}>No matches yet</Text>
            <Text style={sharedStyles.bodyCopy}>Try another food, vendor, or filter.</Text>
          </View>
        )}
        <View style={styles.timelineHeader}>
          <Text style={sharedStyles.cardTitle}>Timeline updates</Text>
        </View>
        {timelineEvents.map((event) => (
          <TimelineCard event={event} key={event.id} />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  dataNotice: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 10
  },
  filterChip: {
    backgroundColor: colors.successSoft,
    borderRadius: 999,
    overflow: "hidden",
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  filterChipActive: {
    backgroundColor: colors.deepGreen
  },
  filterChipText: {
    color: colors.greenContainer,
    fontSize: 12,
    fontWeight: "700"
  },
  filterChipTextActive: {
    color: "#ffffff"
  },
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 18,
    marginTop: 10
  },
  screen: {
    flex: 1
  },
  scrollContent: {
    paddingBottom: 12
  },
  searchInput: {
    backgroundColor: "#eef2ff",
    borderRadius: 999,
    color: colors.text,
    fontSize: 14,
    paddingHorizontal: 14,
    paddingVertical: 13
  },
  stickySearchWrap: {
    backgroundColor: colors.surface,
    elevation: 4,
    paddingBottom: 8,
    paddingTop: 10,
    zIndex: 10
  },
  timelineHeader: {
    marginBottom: 12,
    marginTop: 8
  }
});
