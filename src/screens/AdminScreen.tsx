import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { commerceRepository } from "../repositories/commerceRepository";
import { colors } from "../theme/colors";
import { sharedStyles } from "../theme/sharedStyles";

type Props = {
  onBack: () => void;
};

export function AdminScreen({ onBack }: Props) {
  const metrics = commerceRepository.getAdminMetrics();
  const [actions, setActions] = useState([
    { id: "merchant-approval", label: "Review merchant onboarding", done: false },
    { id: "agent-verification", label: "Verify delivery agent documents", done: false },
    { id: "dispute", label: "Resolve open customer dispute", done: false },
    { id: "audit", label: "Export system audit snapshot", done: false }
  ]);

  function toggleAction(actionId: string) {
    setActions((currentActions) =>
      currentActions.map((action) =>
        action.id === actionId ? { ...action, done: !action.done } : action
      )
    );
  }

  return (
    <View>
      <TouchableOpacity onPress={onBack} style={styles.backButton}>
        <Ionicons color={colors.deepGreen} name="chevron-back" size={20} />
        <Text style={styles.backText}>Profile</Text>
      </TouchableOpacity>
      <Text style={sharedStyles.screenTitle}>Admin</Text>
      <Text style={sharedStyles.bodyCopy}>
        Master dashboard, merchant onboarding, agent logistics, disputes, and audit controls.
      </Text>
      <View style={styles.metricGrid}>
        {metrics.map((metric) => (
          <View key={metric.label} style={styles.metricCard}>
            <Text style={styles.metricValue}>{metric.value}</Text>
            <Text style={sharedStyles.cardTitle}>{metric.label}</Text>
            <Text style={sharedStyles.subtle}>{metric.detail}</Text>
          </View>
        ))}
      </View>
      <View style={sharedStyles.card}>
        <Text style={sharedStyles.cardTitle}>Admin action queue</Text>
        {actions.map((action) => (
          <TouchableOpacity
            key={action.id}
            onPress={() => toggleAction(action.id)}
            style={styles.actionItem}
          >
            <Ionicons
              color={action.done ? colors.emerald : colors.orange}
              name={action.done ? "checkmark-circle" : "ellipse-outline"}
              size={20}
            />
            <Text style={styles.actionText}>{action.label}</Text>
            <Text style={[styles.actionState, action.done ? styles.actionDone : null]}>
              {action.done ? "Done" : "Open"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={sharedStyles.card}>
        <Text style={sharedStyles.cardTitle}>Dispute resolution center</Text>
        <Text style={sharedStyles.bodyCopy}>
          Review transactions, delivery evidence, customer reports, and merchant responses.
        </Text>
      </View>
      <View style={sharedStyles.card}>
        <Text style={sharedStyles.cardTitle}>System audit log</Text>
        <Text style={sharedStyles.bodyCopy}>
          Security and compliance events will be stored server-side with admin-only access.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backButton: {
    alignItems: "center",
    alignSelf: "flex-start",
    flexDirection: "row",
    gap: 4,
    marginBottom: 12,
    paddingVertical: 4
  },
  backText: {
    color: colors.deepGreen,
    fontSize: 14,
    fontWeight: "800"
  },
  metricCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    flex: 1,
    gap: 4,
    padding: 14
  },
  metricGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginVertical: 18
  },
  metricValue: {
    color: colors.orange,
    fontSize: 24,
    fontWeight: "900"
  },
  actionDone: {
    backgroundColor: colors.successSoft,
    color: colors.greenContainer
  },
  actionItem: {
    alignItems: "center",
    borderTopColor: colors.line,
    borderTopWidth: 1,
    flexDirection: "row",
    gap: 10,
    paddingVertical: 12
  },
  actionState: {
    backgroundColor: colors.warningSoft,
    borderRadius: 999,
    color: colors.orange,
    fontSize: 12,
    fontWeight: "900",
    paddingHorizontal: 10,
    paddingVertical: 5
  },
  actionText: {
    color: colors.text,
    flex: 1,
    fontSize: 14,
    fontWeight: "800"
  }
});
