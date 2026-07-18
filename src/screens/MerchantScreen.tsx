import { Ionicons } from "@expo/vector-icons";
import type * as ExpoImagePicker from "expo-image-picker";
import { useEffect, useState } from "react";
import { Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

import { SectionHeader } from "../components/SectionHeader";
import { StatusBadge } from "../components/StatusBadge";
import { WalletPanel } from "../components/WalletPanel";
import { commerceRepository } from "../repositories/commerceRepository";
import { uploadMerchantProductImage } from "../repositories/merchantProductRepository";
import {
  loadProfileCompletion,
  saveProfilePhone,
  saveRoleVerificationAddress
} from "../repositories/profileCompletionRepository";
import { colors } from "../theme/colors";
import { sharedStyles } from "../theme/sharedStyles";
import {
  MerchantDashboardSection,
  Order,
  OrderStatus,
  Product,
  WalletSummary
} from "../types/domain";
import { formatNaira } from "../utils/money";

declare const require: (moduleName: "expo-image-picker") => typeof ExpoImagePicker;

type Props = {
  activeSection: MerchantDashboardSection;
  onBack: () => void;
  orders: Order[];
  products: Product[];
  wallet: WalletSummary;
  onCreateProduct: (name: string, priceNaira: number, imageUrl?: string) => void;
  onCycleProductStatus: (productId: string) => void;
  onSaveStorefront: (storeName: string, storeArea: string) => void;
  onUpdateOrderStatus: (orderId: string | undefined, status: OrderStatus) => void;
  onWalletRefresh: () => void;
  onWalletWithdraw: (amountNaira: number) => void;
};

export function MerchantScreen({
  activeSection,
  onBack,
  onCreateProduct,
  onCycleProductStatus,
  onSaveStorefront,
  onUpdateOrderStatus,
  onWalletRefresh,
  onWalletWithdraw,
  orders,
  products,
  wallet
}: Props) {
  const [productName, setProductName] = useState("");
  const [productPrice, setProductPrice] = useState("");
  const [productImageUrl, setProductImageUrl] = useState("");
  const [storeName, setStoreName] = useState("Mama Put Kitchen");
  const [storeArea, setStoreArea] = useState("Yaba");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verificationAddress, setVerificationAddress] = useState("");
  const [uploadMessage, setUploadMessage] = useState("");
  const [verificationMessage, setVerificationMessage] = useState(
    "Save your phone and private shop address before receiving orders."
  );
  const [isSavingVerification, setIsSavingVerification] = useState(false);
  const metrics = commerceRepository.getMerchantMetrics();
  const priceNaira = Number(productPrice);

  useEffect(() => {
    loadProfileCompletion().then((result) => {
      if (!result.ok) {
        setVerificationMessage(result.message);
        return;
      }
      setPhoneNumber(result.data.phone);
      setVerificationAddress(result.data.merchantVerificationAddress);
    });
  }, []);

  async function pickAndUploadImage() {
    const ImagePicker = require("expo-image-picker");
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

  async function handleSaveVerificationAddress() {
    setIsSavingVerification(true);
    const phoneResult = await saveProfilePhone(phoneNumber);

    if (!phoneResult.ok) {
      setVerificationMessage(phoneResult.message);
      setIsSavingVerification(false);
      return;
    }

    const addressResult = await saveRoleVerificationAddress("merchant", verificationAddress);
    setVerificationMessage(
      addressResult.ok ? "Merchant phone and private shop address saved." : addressResult.message
    );
    if (addressResult.ok) {
      const latest = await loadProfileCompletion();
      if (latest.ok) {
        setPhoneNumber(latest.data.phone);
        setVerificationAddress(latest.data.merchantVerificationAddress);
      }
    }
    setIsSavingVerification(false);
  }

  return (
    <View>
      <View style={styles.topBar}>
        <View style={styles.identity}>
          <View style={styles.storeAvatar}>
            <Ionicons color="#ffffff" name="storefront" size={24} />
          </View>
          <View>
            <Text style={styles.roleEyebrow}>Merchant workspace</Text>
            <Text style={styles.dashboardTitle}>ChowTrek Merchant</Text>
          </View>
        </View>
        <View style={styles.openPill}>
          <View style={styles.openDot} />
          <Text style={styles.openText}>Open</Text>
        </View>
      </View>
      <View style={styles.heroCard}>
        <Text style={styles.kicker}>Today at a glance</Text>
        <Text style={styles.heroValue}>{orders.length} active orders</Text>
        <Text style={styles.heroCopy}>
          Storefront, product media, availability, order queue, handover, and analytics.
        </Text>
      </View>
      {activeSection === "home" ? (
        <>
          <WalletPanel
            onRefresh={onWalletRefresh}
            onWithdraw={onWalletWithdraw}
            title="Store earnings"
            wallet={wallet}
          />
          <View style={styles.metricGrid}>
            {metrics.map((metric) => (
              <View key={metric.label} style={styles.metricCard}>
                <Text style={styles.metricValue}>{metric.value}</Text>
                <Text style={sharedStyles.subtle}>{metric.label}</Text>
              </View>
            ))}
          </View>
          <View style={sharedStyles.card}>
            <View style={sharedStyles.inlineMeta}>
              <Ionicons color={colors.orange} name="megaphone-outline" size={20} />
              <Text style={sharedStyles.metaText}>Create Food Ready, New Product, or Community post</Text>
            </View>
          </View>
        </>
      ) : null}
      {activeSection === "products" ? (
        <>
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
            <TouchableOpacity
              onPress={() => onSaveStorefront(storeName, storeArea)}
              style={styles.statusButton}
            >
              <Text style={styles.statusButtonText}>Save storefront profile</Text>
            </TouchableOpacity>
          </View>
          <View style={sharedStyles.card}>
            <View style={styles.requirementHeader}>
              <Ionicons color={colors.deepGreen} name="shield-checkmark-outline" size={20} />
              <Text style={sharedStyles.cardTitle}>Merchant verification</Text>
            </View>
            <Text style={sharedStyles.bodyCopy}>
              Save your merchant phone and private shop address here. Buyers cannot see the shop verification address; it is only for ChowTrek review.
            </Text>
            <TextInput
              keyboardType="phone-pad"
              onChangeText={setPhoneNumber}
              placeholder="Merchant phone number"
              placeholderTextColor={colors.muted}
              style={styles.input}
              value={phoneNumber}
            />
            <TextInput
              multiline
              onChangeText={setVerificationAddress}
              placeholder="Shop number, street, city"
              placeholderTextColor={colors.muted}
              style={[styles.input, styles.multilineInput]}
              value={verificationAddress}
            />
            <TouchableOpacity
              disabled={isSavingVerification}
              onPress={handleSaveVerificationAddress}
              style={[styles.statusButton, isSavingVerification ? styles.disabledButton : null]}
            >
              <Text style={styles.statusButtonText}>
                {isSavingVerification ? "Saving..." : "Save merchant verification"}
              </Text>
            </TouchableOpacity>
            <Text style={styles.imageMeta}>{verificationMessage}</Text>
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
        </>
      ) : null}
      {activeSection === "orders" ? (
        <>
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
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  dashboardTitle: {
    color: colors.deepGreen,
    fontSize: 20,
    fontWeight: "900"
  },
  heroCard: {
    backgroundColor: colors.greenContainer,
    borderRadius: 16,
    marginTop: 16,
    padding: 18
  },
  heroCopy: {
    color: "#95d3ba",
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
    marginTop: 6
  },
  heroValue: {
    color: "#b0f0d6",
    fontSize: 28,
    fontWeight: "900",
    marginTop: 4
  },
  disabledButton: {
    opacity: 0.62
  },
  identity: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12
  },
  kicker: {
    color: "#95d3ba",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  metricCard: {
    backgroundColor: colors.card,
    borderColor: "rgba(191, 201, 195, 0.26)",
    borderWidth: 1,
    borderRadius: 12,
    flex: 1,
    padding: 14
  },
  multilineInput: {
    minHeight: 82,
    paddingTop: 12,
    textAlignVertical: "top"
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
  openDot: {
    backgroundColor: colors.deepGreen,
    borderRadius: 4,
    height: 8,
    width: 8
  },
  openPill: {
    alignItems: "center",
    backgroundColor: "rgba(176, 240, 214, 0.34)",
    borderRadius: 999,
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7
  },
  openText: {
    color: colors.deepGreen,
    fontSize: 12,
    fontWeight: "900"
  },
  roleEyebrow: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  requirementHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    marginBottom: 8
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
  },
  storeAvatar: {
    alignItems: "center",
    backgroundColor: colors.deepGreen,
    borderRadius: 14,
    height: 44,
    justifyContent: "center",
    width: 44
  },
  topBar: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  }
});
