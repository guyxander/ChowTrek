import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { colors } from "../theme/colors";

type RoleNavItem = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  active?: boolean;
  onPress?: () => void;
};

type Props = {
  items: RoleNavItem[];
};

export function RoleDashboardNav({ items }: Props) {
  return (
    <View style={styles.nav}>
      {items.map((item) => (
        <TouchableOpacity
          accessibilityRole="button"
          key={item.label}
          onPress={item.onPress}
          style={[styles.navItem, item.active ? styles.navItemActive : null]}
        >
          <Ionicons
            color={item.active ? colors.deepGreen : colors.muted}
            name={item.icon}
            size={22}
          />
          <Text style={[styles.navLabel, item.active ? styles.navLabelActive : null]}>
            {item.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  nav: {
    alignItems: "center",
    backgroundColor: colors.card,
    borderColor: "rgba(191, 201, 195, 0.32)",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    gap: 4,
    justifyContent: "space-around",
    marginTop: 22,
    paddingHorizontal: 8,
    paddingVertical: 10
  },
  navItem: {
    alignItems: "center",
    borderRadius: 12,
    flex: 1,
    gap: 3,
    paddingVertical: 6
  },
  navItemActive: {
    backgroundColor: "rgba(176, 240, 214, 0.32)"
  },
  navLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "800"
  },
  navLabelActive: {
    color: colors.deepGreen
  }
});
