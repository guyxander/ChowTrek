import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import { Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

import { SectionHeader } from "../components/SectionHeader";
import { StatusBadge } from "../components/StatusBadge";
import { commerceRepository } from "../repositories/commerceRepository";
import { uploadMerchantProductImage } from "../repositories/merchantProductRepository";
import { colors } from "../theme/colors";
import { sharedStyles } from "../theme/sharedStyles";
import { Order, OrderStatus, Product } from "../types/domain";
import { formatNaira } from "../utils/money";

type Props = {
  onBack: () => void;
  orders: Order[];
  products: Product[];
  onCreateProduct: (name: string, priceNaira: number, imageUrl?: string) => void;
  onCycleProductStatus: (productId: string) => void;
  onUpdateOrderStatus: (orderId: string | undefined, status: OrderStatus) => void;
};

export function MerchantScreen({
  onBack,
  onCreateProduct,
  onCycleProductStatus,
  onUpdateOrderStatus,
  orders,
  products
}: Props) {
  const [productName, setProductName] = useState("");
  const [productPrice, setProductPrice] = useState("");
  const [productImageUrl, setProductImageUrl] = useState("");
  const [storeName, setStoreName] = useState("Mama Put Kitchen");
  const [storeArea, setStoreArea] = useState("Yaba");
  const [uploadMessage, setUploadMessage] = useState("");
  const metrics = commerceRepository.getMerchantMetrics();
  const priceNaira = Number(productPrice);

  async function pickAndUploadImage() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      setUploadMessage("Photo permission is needed to upload product images.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [4, 3],
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85
    });

    if (result.canceled) {
      return;
    }

    setUploadMessage("Uploading product image...");
    const asset = result.assets[0];
    const uploadResult = await uploadMerchantProductImage(asset.uri, asset.fileName ?? undefined);
    setUploadMessage(uploadResult.message);

    if (uploadResult.ok) {
      setProductImageUrl(uploadResult.publicUrl);
    }
  }

  return (
    <View>
      <TouchableOpacity onPress={onBack} style={styles.backButton}>
        <Ionicons color={colors.deepGreen} name="chevron-back" size={20} />
        <Text style={styles.backText}>Profile</Text>
      </TouchableOpacity>
      <Text style={sharedStyles.screenTitle}>Merchant</Text>
      <Text style={sharedStyles.bodyCopy}>
        Manage storefront details, product media, availability, order queue, handover, and
        analytics.
      </Text>
      <View style={styles.metricGrid}>
        {metrics.map((metric) => (
          <View key={metric.label} style={styles.metricCard}>
            <Text style={styles.metricValue}>{metric.value}</Text>
            <Text style={sharedStyles.subtle}>{metric.label}</Text>
          </View>
        ))}
      </View>
      <View style={sharedStyles.card}>
        <Text style={sharedStyles.cardTitle}>Storefront profile</Text>
        <TextInput
          onChangeText={setStoreName}
          placeholder="Store name"
          placeholderTextColor={colors.muted}
          style={styles.input}
          value={storeName}
        />
        <TextInput
          onChangeText={setStoreArea}
          placeholder="Neighborhood"
          placeholderTextColor={colors.muted}
          style={styles.input}
          value={storeArea}
        />
        <View style={styles.profilePreview}>
          <Ionicons color={colors.deepGreen} name="storefront-outline" size={20} />
          <Text style={styles.profilePreviewText}>
            {storeName || "Storefront"} - {storeArea || "Neighborhood"}
          </Text>
        </View>
      </View>
      <View style={sharedStyles.card}>
        <Text style={sharedStyles.cardTitle}>Add product</Text>
        <TextInput
          onChangeText={setProductName}
          placeholder="Product name"
          placeholderTextColor={colors.muted}
          style={styles.input}
          value={productName}
        />
        <TextInput
          keyboardType="number-pad"
          onChangeText={setProductPrice}
          placeholder="Price in NGN"
          placeholderTextColor={colors.muted}
          style={styles.input}
          value={productPrice}
        />
        <TextInput
          autoCapitalize="none"
          onChangeText={setProductImageUrl}
          placeholder="Image URL"
          placeholderTextColor={colors.muted}
          style={styles.input}
          value={productImageUrl}
        />
        <TouchableOpacity onPress={pickAndUploadImage} style={styles.uploadButton}>
          <Ionicons color={colors.deepGreen} name="image-outline" size={18} />
          <Text style={styles.uploadButtonText}>Pick and upload image</Text>
        </TouchableOpacity>
        {uploadMessage ? <Text style={styles.imageMeta}>{uploadMessage}</Text> : null}
        <TouchableOpacity
          onPress={() => {
            onCreateProduct(productName, priceNaira, productImageUrl);
            setProductName("");
            setProductPrice("");
            setProductImageUrl("");
          }}
          style={styles.statusButton}
        >
          <Text style={styles.statusButtonText}>Add to storefront</Text>
        </TouchableOpacity>
      </View>
      <SectionHeader title="Product availability" />
      {products.length > 0 ? (
        products.map((product) => (
          <View key={product.id} style={sharedStyles.card}>
            <View style={styles.row}>
              {product.imageUrl ? (
                <Image source={{ uri: product.imageUrl }} style={styles.productImage} />
              ) : null}
              <View style={styles.productInfo}>
                <Text style={sharedStyles.cardTitle}>{product.name}</Text>
                <Text style={sharedStyles.bodyCopy}>{formatNaira(product.priceNaira)}</Text>
                <Text style={styles.imageMeta}>
                  {product.imageUrl ? "Image attached" : "No product image yet"}
                </Text>
              </View>
              <StatusBadge status={product.status} />
            </View>
            <TouchableOpacity
              onPress={() => onCycleProductStatus(product.id)}
              style={styles.statusButton}
            >
              <Text style={styles.statusButtonText}>Change status</Text>
            </TouchableOpacity>
          </View>
        ))
      ) : (
        <View style={sharedStyles.card}>
          <Text style={sharedStyles.cardTitle}>No products yet</Text>
          <Text style={sharedStyles.bodyCopy}>Add your first product with a price and image URL.</Text>
        </View>
      )}
      <SectionHeader title="Order queue" />
      {orders.length > 0 ? (
        orders.map((order) => (
          <View key={order.id} style={sharedStyles.card}>
          <View style={styles.row}>
            <View>
              <Text style={sharedStyles.cardTitle}>Order #{order.id}</Text>
              <Text style={sharedStyles.bodyCopy}>{order.summary}</Text>
            </View>
            <Text style={styles.queueStatus}>{order.status}</Text>
          </View>
          <View style={styles.actionRow}>
            <TouchableOpacity onPress={() => onUpdateOrderStatus(order.recordId, "Preparing")}>
              <Text style={styles.queueAction}>Accept</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onUpdateOrderStatus(order.recordId, "Ready")}>
              <Text style={styles.queueAction}>Mark ready</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onUpdateOrderStatus(order.recordId, "In Transit")}>
              <Text style={styles.queueAction}>Handover</Text>
            </TouchableOpacity>
          </View>
          </View>
        ))
      ) : (
        <View style={sharedStyles.card}>
          <Text style={sharedStyles.cardTitle}>No open orders</Text>
          <Text style={sharedStyles.bodyCopy}>New paid or pay-on-delivery orders will appear here.</Text>
        </View>
      )}
      <View style={sharedStyles.card}>
        <View style={sharedStyles.inlineMeta}>
          <Ionicons color={colors.orange} name="megaphone-outline" size={20} />
          <Text style={sharedStyles.metaText}>Create Food Ready, New Product, or Community post</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  metricCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    flex: 1,
    padding: 14
  },
  input: {
    backgroundColor: "#eef2ff",
    borderRadius: 8,
    color: colors.text,
    fontSize: 14,
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 12
  },
  imageMeta: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 6
  },
  uploadButton: {
    alignItems: "center",
    borderColor: colors.line,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    marginTop: 10,
    paddingVertical: 12
  },
  uploadButtonText: {
    color: colors.deepGreen,
    fontSize: 13,
    fontWeight: "900"
  },
  backButton: {
    alignItems: "center",
    alignSelf: "flex-start",
    flexDirection: "row",
    gap: 4,
    marginBottom: 12,
    paddingVertical: 4
  },
  backText: {
    color: colors.deepGreen,
    fontSize: 14,
    fontWeight: "800"
  },
  metricGrid: {
    flexDirection: "row",
    gap: 10,
    marginVertical: 18
  },
  metricValue: {
    color: colors.deepGreen,
    fontSize: 22,
    fontWeight: "900"
  },
  productInfo: {
    flex: 1,
    paddingRight: 10
  },
  productImage: {
    backgroundColor: colors.successSoft,
    borderRadius: 8,
    height: 58,
    marginRight: 10,
    width: 58
  },
  profilePreview: {
    alignItems: "center",
    backgroundColor: colors.successSoft,
    borderRadius: 8,
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
    padding: 12
  },
  profilePreviewText: {
    color: colors.deepGreen,
    fontSize: 13,
    fontWeight: "900"
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  actionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 14
  },
  queueAction: {
    backgroundColor: colors.successSoft,
    borderRadius: 999,
    color: colors.greenContainer,
    fontSize: 12,
    fontWeight: "900",
    paddingHorizontal: 10,
    paddingVertical: 7
  },
  queueStatus: {
    backgroundColor: colors.warningSoft,
    borderRadius: 999,
    color: colors.orange,
    fontSize: 12,
    fontWeight: "900",
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  statusButton: {
    alignItems: "center",
    borderColor: colors.deepGreen,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 12,
    paddingVertical: 10
  },
  statusButtonText: {
    color: colors.deepGreen,
    fontSize: 13,
    fontWeight: "900"
  }
});
