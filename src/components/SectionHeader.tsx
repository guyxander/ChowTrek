import { StyleSheet, Text, View } from "react-native";

import { colors } from "../theme/colors";

type Props = {
  title: string;
  action?: string;
};

export function SectionHeader({ title, action }: Props) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action ? <Text style={styles.sectionAction}>{action}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  sectionAction: {
    color: colors.deepGreen,
    fontSize: 14,
    fontWeight: "800"
  },
  sectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "900"
  }
});
