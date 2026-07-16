import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { commerceRepository } from "../repositories/commerceRepository";
import { colors } from "../theme/colors";
import { sharedStyles } from "../theme/sharedStyles";

type Props = {
  onBack: () => void;
};

export function AdminScreen({ onBack }: Props) {
  const metrics = commerceRepository.getAdminMetrics();

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
  }
});
