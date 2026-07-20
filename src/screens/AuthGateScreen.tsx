import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { BrandLogo } from "../components/BrandLogo";
import { signInWithGoogle } from "../repositories/authRepository";
import { colors } from "../theme/colors";

type Props = {
  onSignedIn: (identity: string) => void;
};

export function AuthGateScreen({ onSignedIn }: Props) {
  const [isSending, setIsSending] = useState(false);
  const [message, setMessage] = useState("Sign in to continue with your ChowTrek account.");

  async function handleGoogleSignIn() {
    setIsSending(true);
    const result = await signInWithGoogle();
    setMessage(result.message);

    if (result.ok && result.identity) {
      onSignedIn(result.identity);
    }

    setIsSending(false);
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <BrandLogo size={76} />
        <Text style={styles.title}>Welcome back to ChowTrek</Text>
        <Text style={styles.body}>
          Continue with Google to view your profile, orders, wallet, addresses, and dashboards.
        </Text>
        <TouchableOpacity
          accessibilityRole="button"
          disabled={isSending}
          onPress={handleGoogleSignIn}
          style={[styles.googleButton, isSending ? styles.disabledButton : null]}
        >
          <Ionicons color="#ffffff" name="logo-google" size={18} />
          <Text style={styles.googleButtonText}>
            {isSending ? "Please wait..." : "Continue with Google"}
          </Text>
        </TouchableOpacity>
        <Text style={styles.statusText}>{message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 21,
    marginTop: 10,
    textAlign: "center"
  },
  card: {
    alignItems: "center",
    backgroundColor: colors.card,
    borderColor: "rgba(191, 201, 195, 0.42)",
    borderRadius: 16,
    borderWidth: 1,
    padding: 24,
    shadowColor: "#003527",
    shadowOffset: { height: 12, width: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    width: "100%"
  },
  container: {
    flex: 1,
    justifyContent: "center",
    paddingBottom: 96,
    paddingHorizontal: 18,
    paddingTop: 36
  },
  disabledButton: {
    opacity: 0.62
  },
  googleButton: {
    alignItems: "center",
    backgroundColor: colors.deepGreen,
    borderRadius: 10,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    marginTop: 22,
    paddingHorizontal: 18,
    paddingVertical: 14,
    width: "100%"
  },
  googleButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "900"
  },
  statusText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 12,
    textAlign: "center"
  },
  title: {
    color: colors.deepGreen,
    fontSize: 24,
    fontWeight: "900",
    marginTop: 18,
    textAlign: "center"
  }
});
