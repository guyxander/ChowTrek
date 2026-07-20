import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { Image, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { colors } from "../theme/colors";
import { CartItem, Product, Vendor } from "../types/domain";
import { formatNaira } from "../utils/money";
import { StatusBadge } from "./StatusBadge";

type Props = {
  cartItems: CartItem[];
  products: Product[];
  vendor: Vendor;
  onAddToCart: (product: Product, vendor: Vendor) => void;
  onBack: () => void;
  onCartQuantityChange: (itemId: string, delta: number) => void;
  onOpenCart: () => void;
  onRefresh: () => void;
  onToggleFollow: (vendorId: string) => void;
  refreshing: boolean;
};

const menuCategories = ["Food Ready", "Rice & Bowls", "Grills", "Drinks", "All"];

export function StorefrontView({
  cartItems,
  onAddToCart,
  onBack,
  onCartQuantityChange,
  onOpenCart,
  onRefresh,
  onToggleFollow,
  products,
  refreshing,
  vendor
}: Props) {
  const [selectedCategory, setSelectedCategory] = useState(menuCategories[0]);
  const vendorCartItems = cartItems.filter((item) => item.vendorId === vendor.id);
  const cartCount = vendorCartItems.reduce((total, item) => total + item.quantity, 0);
  const cartTotal = vendorCartItems.reduce(
    (total, item) => total + item.quantity * item.unitPriceNaira,
    0
  );
  const filteredProducts = useMemo(
    () =>
      products.filter((product) => {
        if (selectedCategory === "All") {
          return true;
        }

        if (selectedCategory === "Food Ready") {
          return product.status === "Food Ready";
        }

        return inferCategory(product.name) === selectedCategory;
      }),
    [products, selectedCategory]
  );

  return (
    <View style={styles.screen}>
      <View style={styles.topBar}>
        <TouchableOpacity accessibilityLabel="Back to nearby vendors" onPress={onBack} style={styles.iconButton}>
          <Ionicons color={colors.text} name="chevron-back" size={22} />
        </TouchableOpacity>
        <Text numberOfLines={1} style={styles.topTitle}>
          {vendor.name}
        </Text>
        <TouchableOpacity onPress={() => onToggleFollow(vendor.id)} style={styles.iconButton}>
          <Ionicons
            color={vendor.followed ? colors.orange : colors.deepGreen}
            name={vendor.followed ? "heart" : "heart-outline"}
            size={21}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, cartCount > 0 ? styles.scrollWithCart : null]}
        refreshControl={
          <RefreshControl
            colors={[colors.deepGreen]}
            onRefresh={onRefresh}
            refreshing={refreshing}
            tintColor={colors.deepGreen}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.hero, { backgroundColor: vendor.color }]}>
          <StatusBadge status={vendor.status} />
          <Text style={styles.heroTitle}>{vendor.name}</Text>
          <Text style={styles.heroCopy}>{vendor.category}</Text>
        </View>

        <View style={styles.metaCard}>
          <View style={styles.metaItem}>
            <Ionicons color={colors.orange} name="star" size={17} />
            <Text style={styles.metaStrong}>{vendor.rating}</Text>
            <Text style={styles.metaMuted}>rating</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons color={colors.deepGreen} name="time-outline" size={17} />
            <Text style={styles.metaStrong}>{vendor.etaMinutes} min</Text>
            <Text style={styles.metaMuted}>delivery</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons color={colors.deepGreen} name="navigate-outline" size={17} />
            <Text style={styles.metaStrong}>{vendor.distanceKm.toFixed(1)} km</Text>
            <Text style={styles.metaMuted}>near you</Text>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.categoryList}
          horizontal
          showsHorizontalScrollIndicator={false}
        >
          {menuCategories.map((category) => {
            const isActive = category === selectedCategory;

            return (
              <TouchableOpacity
                key={category}
                onPress={() => setSelectedCategory(category)}
                style={[styles.categoryChip, isActive ? styles.categoryChipActive : null]}
              >
                <Text style={[styles.categoryText, isActive ? styles.categoryTextActive : null]}>
                  {category}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={styles.sectionHeading}>
          <Text style={styles.sectionTitle}>{selectedCategory}</Text>
          <Text style={styles.sectionMeta}>{filteredProducts.length} items</Text>
        </View>

        {filteredProducts.length > 0 ? (
          filteredProducts.map((product) => {
            const cartItem = vendorCartItems.find((item) => item.productId === product.id);
            const isSoldOut = product.status === "Sold Out";

            return (
              <View key={product.id} style={styles.productCard}>
                <View style={styles.productImageWrap}>
                  {product.imageUrl ? (
                    <Image source={{ uri: product.imageUrl }} style={styles.productImage} />
                  ) : (
                    <Ionicons color={colors.deepGreen} name="fast-food-outline" size={26} />
                  )}
                </View>
                <View style={styles.productCopy}>
                  <Text numberOfLines={2} style={styles.productName}>
                    {product.name}
                  </Text>
                  <Text style={styles.productMeta}>{product.status}</Text>
                  <Text style={styles.productPrice}>{formatNaira(product.priceNaira)}</Text>
                </View>
                {cartItem ? (
                  <View style={styles.stepper}>
                    <TouchableOpacity
                      onPress={() => onCartQuantityChange(cartItem.id, -1)}
                      style={styles.stepperButton}
                    >
                      <Ionicons color={colors.deepGreen} name="remove" size={17} />
                    </TouchableOpacity>
                    <Text style={styles.stepperText}>{cartItem.quantity}</Text>
                    <TouchableOpacity
                      onPress={() => onCartQuantityChange(cartItem.id, 1)}
                      style={styles.stepperButton}
                    >
                      <Ionicons color={colors.deepGreen} name="add" size={17} />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    disabled={isSoldOut}
                    onPress={() => onAddToCart(product, vendor)}
                    style={[styles.addButton, isSoldOut ? styles.addButtonDisabled : null]}
                  >
                    <Ionicons color="#ffffff" name="add" size={19} />
                  </TouchableOpacity>
                )}
              </View>
            );
          })
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No items here yet</Text>
            <Text style={styles.emptyCopy}>Try another ChowTrek category from this storefront.</Text>
          </View>
        )}
      </ScrollView>

      {cartCount > 0 ? (
        <TouchableOpacity onPress={onOpenCart} style={styles.cartBar}>
          <View>
            <Text style={styles.cartBarTitle}>{cartCount} item cart</Text>
            <Text style={styles.cartBarMeta}>{formatNaira(cartTotal)} before delivery</Text>
          </View>
          <View style={styles.cartBarAction}>
            <Text style={styles.cartBarActionText}>View cart</Text>
            <Ionicons color="#ffffff" name="chevron-forward" size={17} />
          </View>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

function inferCategory(name: string) {
  const normalized = name.toLowerCase();

  if (normalized.includes("rice") || normalized.includes("jollof") || normalized.includes("bowl")) {
    return "Rice & Bowls";
  }

  if (normalized.includes("suya") || normalized.includes("grill") || normalized.includes("chicken")) {
    return "Grills";
  }

  if (normalized.includes("drink") || normalized.includes("juice") || normalized.includes("water")) {
    return "Drinks";
  }

  return "Food Ready";
}

const styles = StyleSheet.create({
  addButton: {
    alignItems: "center",
    backgroundColor: colors.deepGreen,
    borderRadius: 18,
    height: 36,
    justifyContent: "center",
    width: 36
  },
  addButtonDisabled: {
    backgroundColor: colors.muted
  },
  cartBar: {
    alignItems: "center",
    backgroundColor: colors.deepGreen,
    borderRadius: 14,
    bottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    left: 0,
    paddingHorizontal: 16,
    paddingVertical: 13,
    position: "absolute",
    right: 0
  },
  cartBarAction: {
    alignItems: "center",
    flexDirection: "row",
    gap: 4
  },
  cartBarActionText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "900"
  },
  cartBarMeta: {
    color: "#b0f0d6",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 2
  },
  cartBarTitle: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "900"
  },
  categoryChip: {
    backgroundColor: colors.card,
    borderColor: colors.line,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 13,
    paddingVertical: 9
  },
  categoryChipActive: {
    backgroundColor: colors.deepGreen,
    borderColor: colors.deepGreen
  },
  categoryList: {
    gap: 8,
    paddingVertical: 14
  },
  categoryText: {
    color: colors.deepGreen,
    fontSize: 12,
    fontWeight: "900"
  },
  categoryTextActive: {
    color: "#ffffff"
  },
  emptyCard: {
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 18
  },
  emptyCopy: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "700",
    marginTop: 6,
    textAlign: "center"
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "900"
  },
  hero: {
    borderRadius: 16,
    minHeight: 172,
    padding: 18
  },
  heroCopy: {
    color: "#d9f7e9",
    fontSize: 14,
    fontWeight: "800",
    marginTop: 6
  },
  heroTitle: {
    color: "#ffffff",
    fontSize: 28,
    fontWeight: "900",
    marginTop: "auto"
  },
  iconButton: {
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: 999,
    height: 40,
    justifyContent: "center",
    width: 40
  },
  metaCard: {
    backgroundColor: colors.card,
    borderColor: colors.line,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
    padding: 14
  },
  metaItem: {
    alignItems: "center",
    flex: 1,
    gap: 4
  },
  metaMuted: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "700"
  },
  metaStrong: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "900"
  },
  productCard: {
    alignItems: "center",
    backgroundColor: colors.card,
    borderColor: "rgba(191, 201, 195, 0.28)",
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    marginBottom: 10,
    padding: 12
  },
  productCopy: {
    flex: 1
  },
  productImage: {
    borderRadius: 10,
    height: 64,
    width: 64
  },
  productImageWrap: {
    alignItems: "center",
    backgroundColor: colors.successSoft,
    borderRadius: 10,
    height: 64,
    justifyContent: "center",
    overflow: "hidden",
    width: 64
  },
  productMeta: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 3
  },
  productName: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "900"
  },
  productPrice: {
    color: colors.deepGreen,
    fontSize: 14,
    fontWeight: "900",
    marginTop: 5
  },
  screen: {
    flex: 1
  },
  scrollContent: {
    paddingBottom: 18
  },
  scrollWithCart: {
    paddingBottom: 96
  },
  sectionHeading: {
    alignItems: "flex-end",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10
  },
  sectionMeta: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "800"
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "900"
  },
  stepper: {
    alignItems: "center",
    backgroundColor: colors.successSoft,
    borderRadius: 999,
    flexDirection: "row",
    gap: 8,
    padding: 4
  },
  stepperButton: {
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: 14,
    height: 28,
    justifyContent: "center",
    width: 28
  },
  stepperText: {
    color: colors.deepGreen,
    fontSize: 13,
    fontWeight: "900",
    minWidth: 16,
    textAlign: "center"
  },
  topBar: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    marginBottom: 12
  },
  topTitle: {
    color: colors.text,
    flex: 1,
    fontSize: 17,
    fontWeight: "900",
    textAlign: "center"
  }
});
