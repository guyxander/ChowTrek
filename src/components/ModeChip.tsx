import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { colors } from "../theme/colors";

type Props = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
};

export function ModeChip({ icon, label }: Props) {
  return (
    <View style={styles.modeChip}>
      <Ionicons color={colors.deepGreen} name={icon} size={22} />
      <Text numberOfLines={1} style={styles.modeText}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  modeChip: {
    alignItems: "center",
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    gap: 6,
    paddingHorizontal: 6,
    paddingVertical: 12
  },
  modeText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "800"
  }
});
