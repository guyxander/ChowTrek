import { Image, StyleSheet } from "react-native";

type Props = {
  size?: number;
};

export function BrandLogo({ size = 42 }: Props) {
  return (
    <Image
      accessibilityIgnoresInvertColors
      accessibilityLabel="ChowTrek logo"
      source={require("../../assets/chowtrek-logo.png")}
      style={[styles.logo, { height: size, width: size }]}
    />
  );
}

const styles = StyleSheet.create({
  logo: {
    borderRadius: 10
  }
});
