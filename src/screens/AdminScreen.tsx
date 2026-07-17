import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { WalletPanel } from "../components/WalletPanel";
import { approveAdminQueueItem, loadAdminDashboard } from "../repositories/adminRepository";
import { colors } from "../theme/colors";
import { sharedStyles } from "../theme/sharedStyles";
import { AdminMetric, AdminQueueItem, WalletSummary } from "../types/domain";

type Props = {
  onBack: () => void;
  wallet: WalletSummary;
  onWalletRefresh: () => void;
  onWalletWithdraw: (amountNaira: number) => void;
};

export function AdminScreen({ onBack, onWalletRefresh, onWalletWithdraw, wallet }: Props) {
  const [metrics, setMetrics] = useState<AdminMetric[]>([]);
  const [queue, setQueue] = useState<AdminQueueItem[]>([]);
  const [message, setMessage] = useState("Loading admin queues...");

  useEffect(() => {
    let isMounted = true;

    loadAdminDashboard().then((result) => {
      if (!isMounted) {
        return;
      }

      setMetrics(result.metrics);
      setQueue(result.queue);
      setMessage(result.message);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  async function refreshDashboard() {
    const result = await loadAdminDashboard();
    setMetrics(result.metrics);
    setQueue(result.queue);
    setMessage(result.message);
  }

  async function handleApproval(item: AdminQueueItem) {
    setMessage(`Reviewing ${item.label}...`);
    const result = await approveAdminQueueItem(item);
    setMessage(result.message);

    if (result.ok) {
      await refreshDashboard();
    }
  }

  return (
    <View>
      <View style={styles.topBar}>
        <View style={styles.identity}>
          <View style={styles.adminAvatar}>
            <Ionicons color="#ffffff" name="shield-checkmark" size={24} />
          </View>
          <View>
            <Text style={styles.roleEyebrow}>Operations workspace</Text>
            <Text style={styles.dashboardTitle}>ChowTrek Admin</Text>
          </View>
        </View>
        <TouchableOpacity onPress={refreshDashboard} style={styles.refreshButton}>
          <Ionicons color={colors.deepGreen} name="refresh" size={20} />
        </TouchableOpacity>
      </View>
      <View style={styles.heroCard}>
        <Text style={styles.kicker}>Command center</Text>
        <Text style={styles.heroValue}>Approvals and safety</Text>
        <Text style={styles.heroCopy}>
          Master dashboard, merchant onboarding, agent logistics, disputes, and audit controls.
        </Text>
      </View>
      <WalletPanel
        onRefresh={onWalletRefresh}
        onWithdraw={onWalletWithdraw}
        title="Platform gains"
        wallet={wallet}
      />
      <Text style={styles.adminNotice}>{message}</Text>
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
        {queue.length === 0 ? (
          <Text style={sharedStyles.bodyCopy}>
            No live admin queue items are visible to this account.
          </Text>
        ) : null}
        {queue.map((action) => (
          <TouchableOpacity
            key={action.id}
            onPress={() => handleApproval(action)}
            style={styles.actionItem}
          >
            <Ionicons
              color={action.state === "Approved" ? colors.emerald : colors.orange}
              name={action.state === "Approved" ? "checkmark-circle" : "ellipse-outline"}
              size={20}
            />
            <View style={styles.actionContent}>
              <Text style={styles.actionText}>{action.label}</Text>
              <Text style={sharedStyles.subtle}>{action.detail}</Text>
            </View>
            <Text
              style={[styles.actionState, action.state === "Approved" ? styles.actionDone : null]}
            >
              {action.kind}
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
  adminAvatar: {
    alignItems: "center",
    backgroundColor: colors.deepGreen,
    borderRadius: 14,
    height: 44,
    justifyContent: "center",
    width: 44
  },
  dashboardTitle: {
    color: colors.deepGreen,
    fontSize: 20,
    fontWeight: "900"
  },
  heroCard: {
    backgroundColor: colors.greenContainer,
    borderRadius: 16,
    marginTop: 16,
    padding: 18
  },
  heroCopy: {
    color: "#95d3ba",
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
    marginTop: 6
  },
  heroValue: {
    color: "#b0f0d6",
    fontSize: 26,
    fontWeight: "900",
    marginTop: 4
  },
  identity: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12
  },
  kicker: {
    color: "#95d3ba",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  metricCard: {
    backgroundColor: colors.card,
    borderColor: "rgba(191, 201, 195, 0.26)",
    borderWidth: 1,
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
  actionContent: {
    flex: 1
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
    fontSize: 14,
    fontWeight: "800"
  },
  adminNotice: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 10
  },
  refreshButton: {
    alignItems: "center",
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 12,
    height: 42,
    justifyContent: "center",
    width: 42
  },
  roleEyebrow: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  topBar: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  }
});
