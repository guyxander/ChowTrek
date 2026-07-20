import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { ImageBackground, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { signInWithGoogle } from "../repositories/authRepository";
import { colors } from "../theme/colors";

const launchBackground = require("../../assets/chowtrek-launch-background.png");

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
    <ImageBackground
      accessibilityIgnoresInvertColors
      source={launchBackground}
      style={styles.background}
    >
      <View style={styles.panel}>
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
          <Ionicons color={colors.deepGreen} name="logo-google" size={18} />
          <Text style={styles.googleButtonText}>
            {isSending ? "Please wait..." : "Continue with Google"}
          </Text>
        </TouchableOpacity>
        <Text style={styles.statusText}>{message}</Text>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    justifyContent: "flex-end",
    paddingBottom: 34,
    paddingHorizontal: 18
  },
  body: {
    color: "rgba(255, 255, 255, 0.86)",
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 21,
    marginTop: 10,
    textAlign: "center"
  },
  panel: {
    alignItems: "center",
    backgroundColor: "rgba(0, 32, 24, 0.74)",
    borderColor: "rgba(255, 255, 255, 0.24)",
    borderRadius: 18,
    borderWidth: 1,
    padding: 22,
    shadowColor: "#003527",
    shadowOffset: { height: 12, width: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    width: "100%"
  },
  disabledButton: {
    opacity: 0.62
  },
  googleButton: {
    alignItems: "center",
    backgroundColor: "#ffffff",
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
    color: colors.deepGreen,
    fontSize: 15,
    fontWeight: "900"
  },
  statusText: {
    color: "rgba(255, 255, 255, 0.76)",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 12,
    textAlign: "center"
  },
  title: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "900",
    textAlign: "center"
  }
});
