import { useMemo, useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";

import { TimelineCard } from "../components/TimelineCard";
import { VendorCard } from "../components/VendorCard";
import { colors } from "../theme/colors";
import { sharedStyles } from "../theme/sharedStyles";
import { TimelineEvent, Vendor } from "../types/domain";

const filters = ["Food Ready Near You", "New Products", "Special Offers", "Following"];

type Props = {
  vendors: Vendor[];
  timelineEvents: TimelineEvent[];
  onToggleFollow: (vendorId: string) => void;
};

export function DiscoverScreen({ onToggleFollow, timelineEvents, vendors }: Props) {
  const [query, setQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState(filters[0]);
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

  return (
    <View>
      <Text style={sharedStyles.screenTitle}>Discover</Text>
      <Text style={sharedStyles.bodyCopy}>
        Food ready, new products, special offers, and followed vendor updates.
      </Text>
      <TextInput
        onChangeText={setQuery}
        placeholder="Search vendors, food, or offers"
        placeholderTextColor={colors.muted}
        style={styles.searchInput}
        value={query}
      />
      <View style={styles.filterRow}>
        {filters.map((label) => (
          <Text
            key={label}
            onPress={() => setSelectedFilter(label)}
            style={[styles.filterChip, selectedFilter === label ? styles.filterChipActive : null]}
          >
            {label}
          </Text>
        ))}
      </View>
      {filteredVendors.length > 0 ? (
        filteredVendors.map((vendor) => (
          <VendorCard key={vendor.id} onToggleFollow={onToggleFollow} vendor={vendor} />
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
    </View>
  );
}

const styles = StyleSheet.create({
  filterChip: {
    backgroundColor: colors.successSoft,
    borderRadius: 999,
    color: colors.greenContainer,
    fontSize: 12,
    fontWeight: "700",
    overflow: "hidden",
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  filterChipActive: {
    backgroundColor: colors.deepGreen,
    color: "#ffffff"
  },
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginVertical: 18
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
