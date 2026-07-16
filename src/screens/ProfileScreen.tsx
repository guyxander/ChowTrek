import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { Linking, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import {
  getCurrentSessionIdentity,
  getGoogleRedirectUri,
  signInWithGoogle,
  signOut
} from "../repositories/authRepository";
import { commerceRepository } from "../repositories/commerceRepository";
import {
  activateAgentProfile,
  activateMerchantProfile
} from "../repositories/roleOnboardingRepository";
import { requestPushNotificationPermission } from "../repositories/notificationRepository";
import { hasSupabaseConfig } from "../lib/supabase";
import { colors } from "../theme/colors";
import { sharedStyles } from "../theme/sharedStyles";
import { NotificationPreference, TabKey } from "../types/domain";

const profileRows = [
  { icon: "heart-outline", label: "Followed vendors" },
  { icon: "location-outline", label: "Addresses" },
  { icon: "notifications-outline", label: "Notification categories" },
  { icon: "shield-checkmark-outline", label: "Approved roles" }
] as const;

const legalLinks = [
  { label: "Landing page", url: "https://chowtrek-landing.vercel.app" },
  { label: "Privacy Policy", url: "https://chowtrek-landing.vercel.app/privacy/" },
  { label: "Terms of Use", url: "https://chowtrek-landing.vercel.app/terms/" },
  { label: "Download latest APK", url: "https://chowtrek-landing.vercel.app/api/download" }
];

type Props = {
  onOpenRole: (tab: TabKey) => void;
  notificationPreferences: NotificationPreference[];
  onToggleNotification: (preferenceId: string) => void;
};

export function ProfileScreen({
  notificationPreferences,
  onOpenRole,
  onToggleNotification
}: Props) {
  const [message, setMessage] = useState("Google sign-in is enabled for MVP to avoid SMS costs.");
  const [isSending, setIsSending] = useState(false);
  const [signedInIdentity, setSignedInIdentity] = useState<string | null>(null);
  const adminMetrics = commerceRepository.getAdminMetrics();
  const merchantMetrics = commerceRepository.getMerchantMetrics();
  const agentOpportunities = commerceRepository.getAgentOpportunities();

  useEffect(() => {
    getCurrentSessionIdentity().then(setSignedInIdentity);
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
  }

  async function handleAgentActivation() {
    setIsSending(true);
    const result = await activateAgentProfile();
    setMessage(result.message);
    setIsSending(false);
  }

  async function handlePushPermission() {
    setIsSending(true);
    const result = await requestPushNotificationPermission();
    setMessage(result.message);
    setIsSending(false);
  }

  return (
    <View>
      <Text style={sharedStyles.screenTitle}>Profile</Text>
      <View style={sharedStyles.card}>
        <View style={styles.avatar}>
          <Ionicons color={colors.deepGreen} name="person" size={30} />
        </View>
        <Text style={sharedStyles.cardTitle}>Customer profile</Text>
        <Text style={sharedStyles.bodyCopy}>
          Favorites, addresses, order history, notification categories, and approved roles.
        </Text>
        <TouchableOpacity
          disabled={isSending}
          onPress={handleGoogleSignIn}
          style={[styles.primaryButton, isSending ? styles.disabledButton : null]}
        >
          <Ionicons color="#ffffff" name="logo-google" size={18} />
          <Text style={styles.primaryButtonText}>
            {isSending ? "Opening Google..." : "Continue with Google"}
          </Text>
        </TouchableOpacity>
        {signedInIdentity ? (
          <TouchableOpacity
            disabled={isSending}
            onPress={handleSignOut}
            style={[styles.secondaryButton, isSending ? styles.disabledButton : null]}
          >
            <Text style={styles.secondaryButtonText}>Sign out</Text>
          </TouchableOpacity>
        ) : null}
        <Text style={styles.configNote}>{message}</Text>
        {signedInIdentity ? (
          <Text style={styles.configNote}>Signed in as {signedInIdentity}</Text>
        ) : null}
        <Text style={styles.configNote}>
          Supabase config: {hasSupabaseConfig ? "ready" : "mock mode"}
        </Text>
        <Text style={styles.configNote}>Redirect URI: {getGoogleRedirectUri()}</Text>
      </View>
      {profileRows.map((row) => (
        <ProfileRow icon={row.icon} key={row.label} label={row.label} />
      ))}
      <View style={sharedStyles.card}>
        <Text style={sharedStyles.cardTitle}>Notification categories</Text>
        <TouchableOpacity
          disabled={isSending}
          onPress={handlePushPermission}
          style={[styles.secondaryButton, isSending ? styles.disabledButton : null]}
        >
          <Text style={styles.secondaryButtonText}>Enable push notifications</Text>
        </TouchableOpacity>
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
      <View style={sharedStyles.card}>
        <Text style={sharedStyles.cardTitle}>Merchant role preview</Text>
        <Text style={sharedStyles.bodyCopy}>
          Storefront, product availability, order queue, handover, and analytics.
        </Text>
        <View style={styles.roleGrid}>
          {merchantMetrics.map((metric) => (
            <View key={metric.label} style={styles.roleMetric}>
              <Text style={styles.roleValue}>{metric.value}</Text>
              <Text style={sharedStyles.subtle}>{metric.label}</Text>
            </View>
          ))}
        </View>
        <TouchableOpacity
          disabled={isSending}
          onPress={handleMerchantActivation}
          style={[styles.secondaryButton, isSending ? styles.disabledButton : null]}
        >
          <Text style={styles.secondaryButtonText}>Activate merchant profile</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onOpenRole("merchant")} style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>Open merchant workspace</Text>
        </TouchableOpacity>
      </View>
      <View style={sharedStyles.card}>
        <Text style={sharedStyles.cardTitle}>Delivery agent role preview</Text>
        <Text style={sharedStyles.bodyCopy}>
          Availability, opportunity feed, navigator, earnings, and performance.
        </Text>
        {agentOpportunities.map((opportunity) => (
          <Text key={opportunity.id} style={styles.roleLine}>
            {opportunity.eligibility}: {opportunity.route}
          </Text>
        ))}
        <TouchableOpacity
          disabled={isSending}
          onPress={handleAgentActivation}
          style={[styles.secondaryButton, isSending ? styles.disabledButton : null]}
        >
          <Text style={styles.secondaryButtonText}>Activate agent profile</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onOpenRole("agent")} style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>Open agent workspace</Text>
        </TouchableOpacity>
      </View>
      <View style={sharedStyles.card}>
        <Text style={sharedStyles.cardTitle}>Admin role preview</Text>
        {adminMetrics.map((metric) => (
          <View key={metric.label} style={styles.preferenceRow}>
            <View>
              <Text style={styles.preferenceLabel}>{metric.label}</Text>
              <Text style={sharedStyles.subtle}>{metric.detail}</Text>
            </View>
            <Text style={styles.roleValue}>{metric.value}</Text>
          </View>
        ))}
        <TouchableOpacity onPress={() => onOpenRole("admin")} style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>Open admin workspace</Text>
        </TouchableOpacity>
      </View>
      <View style={sharedStyles.card}>
        <Text style={sharedStyles.cardTitle}>Legal and release links</Text>
        <Text style={sharedStyles.bodyCopy}>
          Review ChowTrek policies, landing page, and the latest hosted Android APK.
        </Text>
        {legalLinks.map((link) => (
          <TouchableOpacity
            key={link.url}
            onPress={() => Linking.openURL(link.url)}
            style={styles.preferenceRow}
          >
            <Text style={styles.preferenceLabel}>{link.label}</Text>
            <Ionicons color={colors.deepGreen} name="open-outline" size={18} />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

function ProfileRow({
  icon,
  label
}: {
  icon: (typeof profileRows)[number]["icon"];
  label: string;
}) {
  return (
    <View style={styles.profileRow}>
      <Ionicons color={colors.deepGreen} name={icon} size={22} />
      <Text style={styles.profileRowText}>{label}</Text>
      <Ionicons color={colors.muted} name="chevron-forward" size={20} />
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: "center",
    backgroundColor: colors.successSoft,
    borderRadius: 28,
    height: 56,
    justifyContent: "center",
    marginBottom: 12,
    width: 56
  },
  configNote: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 8
  },
  disabledButton: {
    opacity: 0.62
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: colors.deepGreen,
    borderRadius: 8,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    marginTop: 14,
    paddingVertical: 14
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "800"
  },
  enabled: {
    backgroundColor: colors.successSoft,
    color: colors.greenContainer
  },
  profileRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    paddingVertical: 15
  },
  profileRowText: {
    color: colors.text,
    flex: 1,
    fontSize: 15,
    fontWeight: "700"
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
  roleGrid: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12
  },
  roleLine: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "700",
    marginTop: 10
  },
  roleMetric: {
    backgroundColor: colors.successSoft,
    borderRadius: 10,
    flex: 1,
    padding: 10
  },
  roleValue: {
    color: colors.deepGreen,
    fontSize: 18,
    fontWeight: "900"
  },
  secondaryButton: {
    alignItems: "center",
    borderColor: colors.deepGreen,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 14,
    paddingVertical: 12
  },
  secondaryButtonText: {
    color: colors.deepGreen,
    fontSize: 14,
    fontWeight: "900"
  }
});
