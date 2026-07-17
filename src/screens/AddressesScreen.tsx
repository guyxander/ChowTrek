import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

import { colors } from "../theme/colors";
import { sharedStyles } from "../theme/sharedStyles";
import { SavedAddress } from "../types/domain";

type Props = {
  addresses: SavedAddress[];
  onAddAddress: (label: string, detail: string) => Promise<SavedAddress | null>;
  onBack: () => void;
  onDeleteAddress: (addressId: string) => void;
  onRefresh: () => void;
  onUpdateAddress: (addressId: string, label: string, detail: string) => Promise<SavedAddress | null>;
};

export function AddressesScreen({
  addresses,
  onAddAddress,
  onBack,
  onDeleteAddress,
  onRefresh,
  onUpdateAddress
}: Props) {
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [label, setLabel] = useState("");
  const [detail, setDetail] = useState("");
  const [formError, setFormError] = useState("");

  const isEditing = Boolean(editingAddressId);
  const formTitle = isEditing ? "Edit address" : "Add address";

  const resetForm = () => {
    setEditingAddressId(null);
    setLabel("");
    setDetail("");
    setFormError("");
  };

  const startEditing = (address: SavedAddress) => {
    setEditingAddressId(address.id);
    setLabel(address.label);
    setDetail(address.detail);
    setFormError("");
  };

  const submitAddress = async () => {
    const normalizedLabel = label.trim();
    const normalizedDetail = detail.trim();

    if (!normalizedLabel || !normalizedDetail) {
      setFormError("Enter a label and delivery address.");
      return;
    }

    const savedAddress = editingAddressId
      ? await onUpdateAddress(editingAddressId, normalizedLabel, normalizedDetail)
      : await onAddAddress(normalizedLabel, normalizedDetail);

    if (savedAddress) {
      resetForm();
    }
  };

  return (
    <View>
      <View style={styles.header}>
        <TouchableOpacity accessibilityLabel="Back" onPress={onBack} style={styles.iconButton}>
          <Ionicons color={colors.deepGreen} name="chevron-back" size={24} />
        </TouchableOpacity>
        <Text style={styles.title}>Addresses</Text>
        <TouchableOpacity accessibilityLabel="Refresh addresses" onPress={onRefresh} style={styles.iconButton}>
          <Ionicons color={colors.deepGreen} name="refresh" size={20} />
        </TouchableOpacity>
      </View>

      <View style={styles.heroCard}>
        <Ionicons color={colors.deepGreen} name="location" size={24} />
        <View style={styles.heroCopy}>
          <Text style={sharedStyles.cardTitle}>Delivery locations</Text>
          <Text style={sharedStyles.bodyCopy}>
            Switch delivery areas from Home. Signed-in addresses sync with Supabase.
          </Text>
        </View>
      </View>

      {addresses.map((address) => (
        <View key={address.id} style={styles.addressCard}>
          <View style={styles.addressIcon}>
            <Ionicons color={colors.deepGreen} name="navigate" size={20} />
          </View>
          <View style={styles.addressCopy}>
            <Text style={styles.addressLabel}>{address.label}</Text>
            <Text style={styles.addressDetail}>{address.detail}</Text>
            <Text style={styles.addressArea}>{address.area}</Text>
          </View>
          <TouchableOpacity
            accessibilityLabel={`Edit ${address.label}`}
            onPress={() => startEditing(address)}
            style={styles.iconAction}
          >
            <Ionicons color={colors.deepGreen} name="create-outline" size={19} />
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityLabel={`Delete ${address.label}`}
            onPress={() => onDeleteAddress(address.id)}
            style={styles.iconAction}
          >
            <Ionicons color={colors.error} name="trash-outline" size={19} />
          </TouchableOpacity>
        </View>
      ))}

      <View style={styles.formCard}>
        <View style={styles.formHeader}>
          <Text style={styles.formTitle}>{formTitle}</Text>
          {isEditing ? (
            <TouchableOpacity accessibilityLabel="Cancel edit" onPress={resetForm} style={styles.cancelButton}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          ) : null}
        </View>
        <TextInput
          autoCapitalize="words"
          onChangeText={setLabel}
          placeholder="Label, e.g. Home or Work"
          placeholderTextColor={colors.muted}
          style={styles.input}
          value={label}
        />
        <TextInput
          autoCapitalize="words"
          onChangeText={setDetail}
          placeholder="Delivery address"
          placeholderTextColor={colors.muted}
          style={[styles.input, styles.addressInput]}
          value={detail}
        />
        {formError ? <Text style={styles.formError}>{formError}</Text> : null}
        <TouchableOpacity
          onPress={() => {
            void submitAddress();
          }}
          style={styles.addButton}
        >
          <Ionicons color="#ffffff" name={isEditing ? "checkmark" : "add"} size={20} />
          <Text style={styles.addButtonText}>{isEditing ? "Save address" : "Add address"}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  addButton: {
    alignItems: "center",
    backgroundColor: colors.deepGreen,
    borderRadius: 10,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    marginTop: 12,
    paddingVertical: 14
  },
  addButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "900"
  },
  addressArea: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 3
  },
  addressCard: {
    alignItems: "center",
    backgroundColor: colors.card,
    borderColor: "rgba(191, 201, 195, 0.28)",
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
    padding: 14
  },
  addressCopy: {
    flex: 1
  },
  addressDetail: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "800",
    marginTop: 2
  },
  addressIcon: {
    alignItems: "center",
    backgroundColor: colors.successSoft,
    borderRadius: 10,
    height: 42,
    justifyContent: "center",
    width: 42
  },
  addressLabel: {
    color: colors.deepGreen,
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  addressInput: {
    minHeight: 52
  },
  cancelButton: {
    paddingHorizontal: 2,
    paddingVertical: 4
  },
  cancelButtonText: {
    color: colors.deepGreen,
    fontSize: 13,
    fontWeight: "900"
  },
  formCard: {
    backgroundColor: colors.card,
    borderColor: "rgba(191, 201, 195, 0.28)",
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 4,
    padding: 14
  },
  formError: {
    color: colors.error,
    fontSize: 12,
    fontWeight: "800",
    marginBottom: 10
  },
  formHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10
  },
  formTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "900"
  },
  iconAction: {
    alignItems: "center",
    height: 40,
    justifyContent: "center",
    width: 40
  },
  input: {
    backgroundColor: colors.surfaceContainerLow,
    borderColor: "rgba(191, 201, 195, 0.34)",
    borderRadius: 10,
    borderWidth: 1,
    color: colors.text,
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 10,
    paddingHorizontal: 12,
    paddingVertical: 12
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 18
  },
  heroCard: {
    alignItems: "flex-start",
    backgroundColor: colors.card,
    borderRadius: 12,
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
    padding: 16
  },
  heroCopy: {
    flex: 1
  },
  iconButton: {
    alignItems: "center",
    height: 42,
    justifyContent: "center",
    width: 42
  },
  title: {
    color: colors.deepGreen,
    fontSize: 22,
    fontWeight: "900"
  }
});
