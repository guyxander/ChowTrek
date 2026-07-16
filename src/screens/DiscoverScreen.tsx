import { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

import { TimelineCard } from "../components/TimelineCard";
import { VendorCard } from "../components/VendorCard";
import { VendorMenuPanel } from "../components/VendorMenuPanel";
import { colors } from "../theme/colors";
import { sharedStyles } from "../theme/sharedStyles";
import { Product, TimelineEvent, Vendor } from "../types/domain";

const filters = ["Food Ready Near You", "New Products", "Special Offers", "Following"];

type Props = {
  dataNotice: string;
  products: Product[];
  vendors: Vendor[];
  timelineEvents: TimelineEvent[];
  onAddToCart: (product: Product, vendor: Vendor) => void;
  onToggleFollow: (vendorId: string) => void;
};

export function DiscoverScreen({
  dataNotice,
  onAddToCart,
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

  return (
    <View style={styles.screen}>
      <View style={styles.fixedHeader}>
        <Text style={sharedStyles.screenTitle}>Discover</Text>
        <Text style={sharedStyles.bodyCopy}>
          Food ready, new products, special offers, and followed vendor updates.
        </Text>
        <Text style={styles.dataNotice}>{dataNotice}</Text>
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
      </View>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        style={styles.discoverScroll}
      >
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
  discoverScroll: {
    flex: 1
  },
  fixedHeader: {
    flexShrink: 0
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
    marginVertical: 18
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
    marginTop: 16,
    paddingHorizontal: 14,
    paddingVertical: 13
  },
  timelineHeader: {
    marginBottom: 12,
    marginTop: 8
  }
});
