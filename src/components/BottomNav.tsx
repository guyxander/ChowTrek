import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { colors } from "../theme/colors";
import { NavItem, TabKey } from "../types/domain";

const navItems: NavItem[] = [
  { key: "home", label: "Home", icon: "home", prdFixed: true },
  { key: "discover", label: "Discover", icon: "compass", prdFixed: true },
  { key: "community", label: "Community", icon: "chatbubbles", prdFixed: true },
  { key: "orders", label: "Orders", icon: "receipt", prdFixed: true },
  { key: "profile", label: "Profile", icon: "person", prdFixed: true }
];

type Props = {
  activeTab: TabKey;
  onChange: (tab: TabKey) => void;
};

export function BottomNav({ activeTab, onChange }: Props) {
  return (
    <View style={styles.nav}>
      {navItems.map((item) => {
        const selected = activeTab === item.key;
        const iconName = selected ? item.icon : (`${item.icon}-outline` as typeof item.icon);

        return (
          <TouchableOpacity
            accessibilityRole="button"
            key={item.key}
            onPress={() => onChange(item.key)}
            style={styles.navItem}
          >
            <Ionicons
              color={selected ? colors.deepGreen : colors.muted}
              name={iconName}
              size={24}
            />
            <Text style={[styles.navLabel, selected ? styles.navLabelActive : null]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  nav: {
    alignItems: "center",
    backgroundColor: colors.card,
    borderTopColor: colors.line,
    borderTopWidth: 1,
    bottom: 0,
    flexDirection: "row",
    justifyContent: "space-around",
    left: 0,
    paddingBottom: 8,
    paddingTop: 8,
    position: "absolute",
    right: 0
  },
  navItem: {
    alignItems: "center",
    flex: 1,
    gap: 3
  },
  navLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "600"
  },
  navLabelActive: {
    color: colors.deepGreen,
    fontWeight: "800"
  }
});
