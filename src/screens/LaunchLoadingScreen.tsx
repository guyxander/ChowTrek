import { ActivityIndicator, ImageBackground, StyleSheet, Text, View } from "react-native";

const launchBackground = require("../../assets/chowtrek-google-signin-background.png");

export function LaunchLoadingScreen() {
  return (
    <ImageBackground
      accessibilityIgnoresInvertColors
      source={launchBackground}
      style={styles.background}
    >
      <View style={styles.loadingPill}>
        <ActivityIndicator color="#ffffff" />
        <Text style={styles.loadingText}>Loading ChowTrek</Text>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    justifyContent: "flex-end",
    paddingBottom: 58,
    paddingHorizontal: 24
  },
  loadingPill: {
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: "rgba(0, 53, 39, 0.56)",
    borderColor: "rgba(255, 255, 255, 0.24)",
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 18,
    paddingVertical: 12
  },
  loadingText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "900"
  }
});
