import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { colors } from "../theme/colors";
import { sharedStyles } from "../theme/sharedStyles";
import { SavedAddress } from "../types/domain";

type Props = {
  addresses: SavedAddress[];
  onAddAddress: () => Promise<SavedAddress | null>;
  onBack: () => void;
  onDeleteAddress: (addressId: string) => void;
  onRefresh: () => void;
};

export function AddressesScreen({
  addresses,
  onAddAddress,
  onBack,
  onDeleteAddress,
  onRefresh
}: Props) {
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
            accessibilityLabel={`Delete ${address.label}`}
            onPress={() => onDeleteAddress(address.id)}
            style={styles.deleteButton}
          >
            <Ionicons color={colors.error} name="trash-outline" size={19} />
          </TouchableOpacity>
        </View>
      ))}

      <TouchableOpacity
        onPress={() => {
          void onAddAddress();
        }}
        style={styles.addButton}
      >
        <Ionicons color="#ffffff" name="add" size={20} />
        <Text style={styles.addButtonText}>Add address</Text>
      </TouchableOpacity>
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
  deleteButton: {
    alignItems: "center",
    height: 40,
    justifyContent: "center",
    width: 40
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
