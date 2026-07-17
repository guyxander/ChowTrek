import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { colors } from "../theme/colors";
import { OrderStatus } from "../types/domain";

const steps: OrderStatus[] = ["Preparing", "Ready", "In Transit", "Arrived", "Delivered"];

type Props = {
  status: OrderStatus;
};

export function OrderProgress({ status }: Props) {
  const activeIndex = Math.max(0, steps.indexOf(status));

  return (
    <View style={styles.progressRow}>
      {steps.map((step, index) => {
        const isActive = index <= activeIndex;
        return (
          <View key={step} style={styles.stepWrap}>
            <View style={[styles.stepIcon, isActive ? styles.stepIconActive : null]}>
              <Ionicons
                color={isActive ? "#ffffff" : colors.muted}
                name={isActive ? "checkmark" : "ellipse-outline"}
                size={16}
              />
            </View>
            <Text style={[styles.stepLabel, isActive ? styles.stepLabelActive : null]}>{step}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  progressRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 14
  },
  stepIcon: {
    alignItems: "center",
    backgroundColor: "#f3f4f6",
    borderRadius: 16,
    height: 32,
    justifyContent: "center",
    width: 32
  },
  stepIconActive: {
    backgroundColor: colors.deepGreen
  },
  stepLabel: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: "700",
    marginTop: 5,
    textAlign: "center"
  },
  stepLabelActive: {
    color: colors.deepGreen,
    fontWeight: "900"
  },
  stepWrap: {
    alignItems: "center",
    flex: 1
  }
});
