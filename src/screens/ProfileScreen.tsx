import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";

import {
  getCurrentSessionIdentity,
  signInWithGoogle,
  signOut
} from "../repositories/authRepository";
import {
  activateAgentProfile,
  activateMerchantProfile
} from "../repositories/roleOnboardingRepository";
import { requestPushNotificationPermission } from "../repositories/notificationRepository";
import { colors } from "../theme/colors";
import { NotificationPreference, TabKey, WalletSummary } from "../types/domain";
import { formatNaira } from "../utils/money";

const profileImage =
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80";

const favoriteMerchants = [
  {
    id: "mama-put",
    name: "Mama Put Kitchen",
    rating: "4.8",
    distance: "1.2 km",
    image:
      "https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?auto=format&fit=crop&w=300&q=80"
  },
  {
    id: "jollof-hub",
    name: "The Jollof Hub",
    rating: "4.5",
    distance: "2.4 km",
    image:
      "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=300&q=80"
  }
];

const legalLinks = [
  { label: "Privacy Policy", url: "https://chowtrek-landing.vercel.app/privacy/" },
  { label: "Terms of Service", url: "https://chowtrek-landing.vercel.app/terms/" }
];

type Props = {
  onOpenRole: (tab: TabKey) => void;
  onOpenWallet: () => void;
  notificationPreferences: NotificationPreference[];
  onToggleNotification: (preferenceId: string) => void;
  wallet: WalletSummary;
};

export function ProfileScreen({
  notificationPreferences,
  onOpenRole,
  onOpenWallet,
  onToggleNotification,
  wallet
}: Props) {
  const [message, setMessage] = useState("Sign in to sync your ChowTrek profile.");
  const [isSending, setIsSending] = useState(false);
  const [signedInIdentity, setSignedInIdentity] = useState<string | null>(null);

  useEffect(() => {
    getCurrentSessionIdentity().then((identity) => {
      setSignedInIdentity(identity);
      if (identity) {
        setMessage("Your profile is synced with Google.");
      }
    });
  }, []);

  async function handleGoogleSignIn() {
    setIsSending(true);
    const result = await signInWithGoogle();
    setMessage(result.message);
    if (result.ok && result.identity) {
      setSignedInIdentity(result.identity);
    }
    setIsSending(false);
  }

  async function handleSignOut() {
    setIsSending(true);
    const result = await signOut();
    setMessage(result.message);
    if (result.ok) {
      setSignedInIdentity(null);
    }
    setIsSending(false);
  }

  async function handleMerchantActivation() {
    setIsSending(true);
    const result = await activateMerchantProfile();
    setMessage(result.message);
    setIsSending(false);
    if (result.ok) {
      onOpenRole("merchant");
    }
  }

  async function handleAgentActivation() {
    setIsSending(true);
    const result = await activateAgentProfile();
    setMessage(result.message);
    setIsSending(false);
    if (result.ok) {
      onOpenRole("agent");
    }
  }

  async function handlePushPermission() {
    setIsSending(true);
    const result = await requestPushNotificationPermission();
    setMessage(result.message);
    setIsSending(false);
  }

  return (
    <View>
      <View style={styles.topBar}>
        <View style={styles.topBarTitle}>
          <Ionicons color={colors.deepGreen} name="location" size={24} />
          <Text style={styles.topBarText}>Profile</Text>
        </View>
        <Ionicons color={colors.deepGreen} name="search" size={24} />
      </View>

      <View style={styles.profileHeader}>
        <View style={styles.avatarRing}>
          <Image source={{ uri: profileImage }} style={styles.avatarImage} />
          <TouchableOpacity style={styles.editAvatarButton}>
            <Ionicons color="#ffffff" name="pencil" size={14} />
          </TouchableOpacity>
        </View>
        <Text style={styles.profileName}>{signedInIdentity ?? "ChowTrek Guest"}</Text>
        <View style={styles.memberBadge}>
          <Ionicons color="#783200" name="shield-checkmark" size={14} />
          <Text style={styles.memberBadgeText}>Member since Oct 2023</Text>
        </View>
        <TouchableOpacity
          disabled={isSending}
          onPress={signedInIdentity ? handleSignOut : handleGoogleSignIn}
          style={[styles.googleButton, isSending ? styles.disabledButton : null]}
        >
          <Ionicons color="#ffffff" name={signedInIdentity ? "log-out-outline" : "logo-google"} size={18} />
          <Text style={styles.googleButtonText}>
            {isSending ? "Please wait..." : signedInIdentity ? "Logout" : "Continue with Google"}
          </Text>
        </TouchableOpacity>
        <Text style={styles.statusText}>{message}</Text>
      </View>

      <SectionTitle title="Quick Actions" />
      <View style={styles.bentoGrid}>
        <BentoAction icon="heart" label="My Favorites" tone="green" />
        <BentoAction icon="location" label="Addresses" tone="orange" />
        <BentoAction
          icon="wallet"
          label={`Wallet ${formatNaira(wallet.availableBalanceNaira)}`}
          tone="green"
          onPress={onOpenWallet}
        />
        <BentoAction icon="notifications" label="Notifications" tone="orange" onPress={handlePushPermission} />
      </View>

      <SectionTitle title="Role Dashboards" />
      <View style={styles.roleGrid}>
        <RoleButton icon="storefront" label="Merchant" onPress={handleMerchantActivation} />
        <RoleButton icon="bicycle" label="Delivery" onPress={handleAgentActivation} />
        <RoleButton icon="shield-checkmark" label="Admin" onPress={() => onOpenRole("admin")} />
      </View>

      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Favorite Merchants</Text>
        <TouchableOpacity>
          <Text style={styles.viewAllText}>View All</Text>
        </TouchableOpacity>
      </View>
      <ScrollView
        contentContainerStyle={styles.favoriteList}
        horizontal
        showsHorizontalScrollIndicator={false}
      >
        {favoriteMerchants.map((merchant) => (
          <View key={merchant.id} style={styles.merchantCard}>
            <Image source={{ uri: merchant.image }} style={styles.merchantImage} />
            <View style={styles.merchantMeta}>
              <Text numberOfLines={1} style={styles.merchantName}>
                {merchant.name}
              </Text>
              <View style={styles.ratingRow}>
                <Ionicons color={colors.orange} name="star" size={14} />
                <Text style={styles.ratingText}>
                  {merchant.rating} - {merchant.distance}
                </Text>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.menuCard}>
        <MenuRow icon="wallet-outline" label="Wallet" onPress={onOpenWallet} />
        <MenuRow icon="settings-outline" label="Settings" />
        <MenuRow icon="help-circle-outline" label="Help & Support" />
        <MenuRow icon="people-outline" label="Invite Friends" />
        <MenuRow
          danger
          icon="log-out-outline"
          label="Logout"
          onPress={signedInIdentity ? handleSignOut : undefined}
        />
      </View>

      <View style={styles.notificationCard}>
        <Text style={styles.cardTitle}>Notification categories</Text>
        {notificationPreferences.map((preference) => (
          <TouchableOpacity
            key={preference.id}
            onPress={() => onToggleNotification(preference.id)}
            style={styles.preferenceRow}
          >
            <Text style={styles.preferenceLabel}>{preference.label}</Text>
            <Text style={[styles.preferenceState, preference.enabled ? styles.enabled : null]}>
              {preference.enabled ? "On" : "Off"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.footer}>
        <Text style={styles.versionText}>ChowTrek v0.1.0</Text>
        <View style={styles.legalRow}>
          {legalLinks.map((link) => (
            <TouchableOpacity key={link.url} onPress={() => Linking.openURL(link.url)}>
              <Text style={styles.legalText}>{link.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
}

function SectionTitle({ title }: { title: string }) {
  return <Text style={styles.sectionTitle}>{title}</Text>;
}

function BentoAction({
  icon,
  label,
  onPress,
  tone
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress?: () => void;
  tone: "green" | "orange";
}) {
  const iconColor = tone === "green" ? colors.deepGreen : colors.orange;
  const iconBackground = tone === "green" ? "rgba(6, 78, 59, 0.08)" : "rgba(249, 115, 22, 0.1)";

  return (
    <TouchableOpacity onPress={onPress} style={styles.bentoCard}>
      <View style={[styles.bentoIcon, { backgroundColor: iconBackground }]}>
        <Ionicons color={iconColor} name={icon} size={22} />
      </View>
      <Text style={styles.bentoLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

function RoleButton({
  icon,
  label,
  onPress
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.roleButton}>
      <View style={styles.roleIcon}>
        <Ionicons color={colors.deepGreen} name={icon} size={22} />
      </View>
      <Text style={styles.roleLabel}>{label}</Text>
      <Ionicons color={colors.muted} name="chevron-forward" size={16} />
    </TouchableOpacity>
  );
}

function MenuRow({
  danger,
  icon,
  label,
  onPress
}: {
  danger?: boolean;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.menuRow}>
      <View style={styles.menuRowLeft}>
        <Ionicons color={danger ? colors.error : colors.muted} name={icon} size={22} />
        <Text style={[styles.menuLabel, danger ? styles.dangerText : null]}>{label}</Text>
      </View>
      <Ionicons color={danger ? colors.error : colors.line} name="chevron-forward" size={20} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  avatarImage: {
    borderColor: colors.surface,
    borderRadius: 46,
    borderWidth: 2,
    height: 92,
    width: 92
  },
  avatarRing: {
    alignItems: "center",
    backgroundColor: colors.deepGreen,
    borderRadius: 52,
    height: 104,
    justifyContent: "center",
    width: 104
  },
  bentoCard: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 12,
    gap: 12,
    minHeight: 104,
    padding: 16,
    width: "48%"
  },
  bentoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 12,
    marginBottom: 24
  },
  bentoIcon: {
    alignItems: "center",
    borderRadius: 8,
    height: 40,
    justifyContent: "center",
    width: 40
  },
  bentoLabel: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "800"
  },
  cardTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 6
  },
  dangerText: {
    color: colors.error
  },
  disabledButton: {
    opacity: 0.62
  },
  editAvatarButton: {
    alignItems: "center",
    backgroundColor: colors.deepGreen,
    borderColor: colors.surface,
    borderRadius: 16,
    borderWidth: 2,
    bottom: 0,
    height: 32,
    justifyContent: "center",
    position: "absolute",
    right: 0,
    width: 32
  },
  enabled: {
    backgroundColor: colors.successSoft,
    color: colors.greenContainer
  },
  favoriteList: {
    gap: 12,
    paddingBottom: 4
  },
  footer: {
    alignItems: "center",
    gap: 8,
    paddingBottom: 10,
    paddingTop: 18
  },
  googleButton: {
    alignItems: "center",
    backgroundColor: colors.deepGreen,
    borderRadius: 8,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    marginTop: 14,
    paddingHorizontal: 18,
    paddingVertical: 12
  },
  googleButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "800"
  },
  legalRow: {
    flexDirection: "row",
    gap: 28
  },
  legalText: {
    color: colors.greenContainer,
    fontSize: 12,
    fontWeight: "700"
  },
  memberBadge: {
    alignItems: "center",
    backgroundColor: colors.secondaryFixed,
    borderRadius: 999,
    flexDirection: "row",
    gap: 6,
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 5
  },
  memberBadgeText: {
    color: "#783200",
    fontSize: 12,
    fontWeight: "800"
  },
  menuCard: {
    backgroundColor: colors.card,
    borderColor: "rgba(191, 201, 195, 0.28)",
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 24,
    overflow: "hidden"
  },
  menuLabel: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "600"
  },
  menuRow: {
    alignItems: "center",
    borderBottomColor: "rgba(191, 201, 195, 0.28)",
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16
  },
  menuRowLeft: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12
  },
  merchantCard: {
    alignItems: "center",
    backgroundColor: colors.card,
    borderColor: "rgba(191, 201, 195, 0.28)",
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    padding: 12,
    width: 256
  },
  merchantImage: {
    backgroundColor: colors.surfaceDim,
    borderRadius: 8,
    height: 64,
    width: 64
  },
  merchantMeta: {
    flex: 1
  },
  merchantName: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "800"
  },
  notificationCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    marginTop: 12,
    padding: 16
  },
  preferenceLabel: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "700"
  },
  preferenceRow: {
    alignItems: "center",
    borderTopColor: colors.line,
    borderTopWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12
  },
  preferenceState: {
    backgroundColor: "#f3f4f6",
    borderRadius: 999,
    color: colors.muted,
    fontSize: 12,
    fontWeight: "900",
    paddingHorizontal: 10,
    paddingVertical: 5
  },
  profileHeader: {
    alignItems: "center",
    gap: 4,
    marginBottom: 26,
    paddingTop: 10
  },
  profileName: {
    color: colors.deepGreen,
    fontSize: 24,
    fontWeight: "900",
    marginTop: 8,
    textAlign: "center"
  },
  ratingRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 4,
    marginTop: 5
  },
  ratingText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700"
  },
  roleButton: {
    alignItems: "center",
    backgroundColor: colors.card,
    borderColor: "rgba(191, 201, 195, 0.28)",
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    gap: 8,
    minWidth: 96,
    padding: 12
  },
  roleGrid: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 24
  },
  roleIcon: {
    alignItems: "center",
    backgroundColor: "rgba(6, 78, 59, 0.08)",
    borderRadius: 8,
    height: 40,
    justifyContent: "center",
    width: 40
  },
  roleLabel: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "900",
    textAlign: "center"
  },
  sectionHeaderRow: {
    alignItems: "flex-end",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12
  },
  sectionTitle: {
    color: colors.deepGreen,
    fontSize: 20,
    fontWeight: "900",
    marginBottom: 14
  },
  statusText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 6,
    textAlign: "center"
  },
  topBar: {
    alignItems: "center",
    backgroundColor: colors.surface,
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
    paddingVertical: 6
  },
  topBarText: {
    color: colors.deepGreen,
    fontSize: 20,
    fontWeight: "900"
  },
  topBarTitle: {
    alignItems: "center",
    flexDirection: "row",
    gap: 14
  },
  versionText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700"
  },
  viewAllText: {
    color: colors.deepGreen,
    fontSize: 14,
    fontWeight: "800"
  }
});
