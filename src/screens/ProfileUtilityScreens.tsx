import { Ionicons } from "@expo/vector-icons";
import { Linking, Share, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { colors } from "../theme/colors";
import { sharedStyles } from "../theme/sharedStyles";
import { NotificationPreference, Vendor } from "../types/domain";

type HeaderProps = {
  onBack: () => void;
  title: string;
};

function UtilityHeader({ onBack, title }: HeaderProps) {
  return (
    <View style={styles.header}>
      <TouchableOpacity accessibilityLabel="Back" onPress={onBack} style={styles.iconButton}>
        <Ionicons color={colors.deepGreen} name="chevron-back" size={24} />
      </TouchableOpacity>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.iconButton} />
    </View>
  );
}

export function FavoritesScreen({
  onBack,
  onOpenVendor,
  vendors
}: {
  onBack: () => void;
  onOpenVendor: (vendorId: string) => void;
  vendors: Vendor[];
}) {
  const favoriteVendors = vendors.filter((vendor) => vendor.followed);

  return (
    <View>
      <UtilityHeader onBack={onBack} title="Favorites" />
      {favoriteVendors.length > 0 ? (
        favoriteVendors.map((vendor) => (
          <TouchableOpacity key={vendor.id} onPress={() => onOpenVendor(vendor.id)} style={styles.rowCard}>
            <View style={styles.rowIcon}>
              <Ionicons color={colors.deepGreen} name="heart" size={20} />
            </View>
            <View style={styles.rowCopy}>
              <Text style={styles.rowTitle}>{vendor.name}</Text>
              <Text style={styles.rowMeta}>
                {vendor.category} • {vendor.distanceKm} km • {vendor.etaMinutes} min
              </Text>
            </View>
            <Ionicons color={colors.muted} name="chevron-forward" size={20} />
          </TouchableOpacity>
        ))
      ) : (
        <View style={sharedStyles.card}>
          <Text style={sharedStyles.cardTitle}>No favorites yet</Text>
          <Text style={sharedStyles.bodyCopy}>Follow nearby vendors and they will appear here.</Text>
        </View>
      )}
    </View>
  );
}

export function NotificationSettingsScreen({
  notificationPreferences,
  onBack,
  onRequestPush,
  onToggleNotification
}: {
  notificationPreferences: NotificationPreference[];
  onBack: () => void;
  onRequestPush: () => void;
  onToggleNotification: (preferenceId: string) => void;
}) {
  return (
    <View>
      <UtilityHeader onBack={onBack} title="Notifications" />
      <TouchableOpacity onPress={onRequestPush} style={styles.primaryButton}>
        <Ionicons color="#ffffff" name="notifications" size={20} />
        <Text style={styles.primaryButtonText}>Enable push alerts</Text>
      </TouchableOpacity>
      {notificationPreferences.map((preference) => (
        <TouchableOpacity
          key={preference.id}
          onPress={() => onToggleNotification(preference.id)}
          style={styles.rowCard}
        >
          <View style={styles.rowIcon}>
            <Ionicons color={colors.deepGreen} name="notifications-outline" size={20} />
          </View>
          <View style={styles.rowCopy}>
            <Text style={styles.rowTitle}>{preference.label}</Text>
            <Text style={styles.rowMeta}>{preference.enabled ? "Enabled" : "Disabled"}</Text>
          </View>
          <Text style={[styles.statePill, preference.enabled ? styles.statePillActive : null]}>
            {preference.enabled ? "On" : "Off"}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export function SettingsScreen({ onBack }: { onBack: () => void }) {
  return (
    <View>
      <UtilityHeader onBack={onBack} title="Settings" />
      <InfoRow icon="language-outline" label="Language" value="English" />
      <InfoRow icon="cash-outline" label="Currency" value="NGN" />
      <InfoRow icon="shield-checkmark-outline" label="Security" value="Google sign-in" />
      <InfoRow icon="phone-portrait-outline" label="App version" value="0.1.0" />
    </View>
  );
}

export function SupportScreen({ onBack }: { onBack: () => void }) {
  return (
    <View>
      <UtilityHeader onBack={onBack} title="Help" />
      <View style={sharedStyles.card}>
        <Text style={sharedStyles.cardTitle}>How can we help?</Text>
        <Text style={sharedStyles.bodyCopy}>
          Get help with orders, merchant onboarding, delivery tasks, wallet balances, and account access.
        </Text>
      </View>
      <TouchableOpacity onPress={() => Linking.openURL("mailto:support@chowtrek.app")} style={styles.rowCard}>
        <View style={styles.rowIcon}>
          <Ionicons color={colors.deepGreen} name="mail-outline" size={20} />
        </View>
        <View style={styles.rowCopy}>
          <Text style={styles.rowTitle}>Email support</Text>
          <Text style={styles.rowMeta}>support@chowtrek.app</Text>
        </View>
        <Ionicons color={colors.muted} name="open-outline" size={18} />
      </TouchableOpacity>
    </View>
  );
}

export function InviteScreen({ onBack }: { onBack: () => void }) {
  return (
    <View>
      <UtilityHeader onBack={onBack} title="Invite" />
      <View style={sharedStyles.card}>
        <Text style={sharedStyles.cardTitle}>Bring people to ChowTrek</Text>
        <Text style={sharedStyles.bodyCopy}>
          Share ChowTrek with customers, food vendors, and delivery partners in your area.
        </Text>
      </View>
      <TouchableOpacity
        onPress={() => {
          void Share.share({
            message: "Try ChowTrek for Food Ready vendors near you: https://chowtrek-landing.vercel.app"
          });
        }}
        style={styles.primaryButton}
      >
        <Ionicons color="#ffffff" name="share-social" size={20} />
        <Text style={styles.primaryButtonText}>Share ChowTrek</Text>
      </TouchableOpacity>
    </View>
  );
}

function InfoRow({
  icon,
  label,
  value
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.rowCard}>
      <View style={styles.rowIcon}>
        <Ionicons color={colors.deepGreen} name={icon} size={20} />
      </View>
      <View style={styles.rowCopy}>
        <Text style={styles.rowTitle}>{label}</Text>
        <Text style={styles.rowMeta}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 18
  },
  iconButton: {
    alignItems: "center",
    height: 42,
    justifyContent: "center",
    width: 42
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: colors.deepGreen,
    borderRadius: 10,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    marginBottom: 14,
    paddingVertical: 14
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "900"
  },
  rowCard: {
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
  rowCopy: {
    flex: 1
  },
  rowIcon: {
    alignItems: "center",
    backgroundColor: colors.successSoft,
    borderRadius: 10,
    height: 42,
    justifyContent: "center",
    width: 42
  },
  rowMeta: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 3
  },
  rowTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "900"
  },
  statePill: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 999,
    color: colors.muted,
    fontSize: 12,
    fontWeight: "900",
    paddingHorizontal: 10,
    paddingVertical: 5
  },
  statePillActive: {
    backgroundColor: colors.successSoft,
    color: colors.greenContainer
  },
  title: {
    color: colors.deepGreen,
    fontSize: 22,
    fontWeight: "900"
  }
});
