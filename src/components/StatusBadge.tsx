import { StyleSheet, Text, View } from "react-native";

import { colors } from "../theme/colors";
import { FoodStatus } from "../types/domain";

type Props = {
  status: FoodStatus;
};

export function StatusBadge({ status }: Props) {
  const badgeStyle =
    status === "Food Ready"
      ? styles.readyBadge
      : status === "Preparing"
        ? styles.preparingBadge
        : styles.soldOutBadge;
  const textStyle = status === "Food Ready" ? styles.readyBadgeText : styles.neutralBadgeText;

  return (
    <View style={[styles.statusBadge, badgeStyle]}>
      <Text style={[styles.statusText, textStyle]}>{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  neutralBadgeText: {
    color: colors.greenContainer
  },
  preparingBadge: {
    backgroundColor: colors.successSoft
  },
  readyBadge: {
    backgroundColor: colors.orange
  },
  readyBadgeText: {
    color: "#ffffff"
  },
  soldOutBadge: {
    backgroundColor: "#f3f4f6"
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5
  },
  statusText: {
    fontSize: 12,
    fontWeight: "800"
  }
});
