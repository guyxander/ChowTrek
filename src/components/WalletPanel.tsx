import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { colors } from "../theme/colors";
import { WalletSummary } from "../types/domain";
import { formatNaira } from "../utils/money";

type Props = {
  title?: string;
  wallet: WalletSummary;
  compact?: boolean;
  onAddMoney?: () => void;
  onRefresh?: () => void;
  onWithdraw?: (amountNaira: number) => void;
};

const roleLabel = {
  customer: "Customer wallet",
  merchant: "Merchant wallet",
  agent: "Agent wallet",
  admin: "Platform wallet"
} as const;

export function WalletPanel({
  compact,
  onAddMoney,
  onRefresh,
  onWithdraw,
  title,
  wallet
}: Props) {
  const canWithdraw = wallet.availableBalanceNaira > 0;
  const withdrawAmount = Math.max(0, wallet.availableBalanceNaira);

  return (
    <View style={[styles.card, compact ? styles.compactCard : null]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.kicker}>{roleLabel[wallet.role]}</Text>
          <Text style={styles.title}>{title ?? "Wallet"}</Text>
        </View>
        <View style={styles.headerActions}>
          {onRefresh ? (
            <TouchableOpacity accessibilityLabel="Refresh wallet" onPress={onRefresh} style={styles.iconButton}>
              <Ionicons color={colors.deepGreen} name="refresh" size={18} />
            </TouchableOpacity>
          ) : null}
          {onAddMoney ? (
            <TouchableOpacity onPress={onAddMoney} style={styles.addButton}>
              <Ionicons color="#ffffff" name="add" size={17} />
              <Text style={styles.addButtonText}>Add Money</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Total Balance - NGN</Text>
        <Text style={styles.balanceValue}>{formatNaira(wallet.availableBalanceNaira)}</Text>
        <View style={styles.accountRow}>
          <Ionicons color="#b0f0d6" name="card-outline" size={18} />
          <Text style={styles.accountText}>{wallet.virtualAccount}</Text>
        </View>
      </View>

      <View style={styles.bucketRow}>
        <View style={styles.bucket}>
          <Text style={styles.bucketLabel}>MAIN BALANCE</Text>
          <Text style={styles.bucketValue}>{formatNaira(wallet.availableBalanceNaira)}</Text>
        </View>
        <View style={styles.bucket}>
          <Text style={styles.bucketLabel}>PENDING</Text>
          <Text style={styles.bucketValue}>{formatNaira(wallet.pendingBalanceNaira)}</Text>
        </View>
        {!compact ? (
          <View style={styles.bucket}>
            <Text style={styles.bucketLabel}>EARNED</Text>
            <Text style={styles.bucketValue}>{formatNaira(wallet.totalEarnedNaira)}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.actionList}>
        {onWithdraw ? (
          <TouchableOpacity
            disabled={!canWithdraw}
            onPress={() => onWithdraw(withdrawAmount)}
            style={[styles.actionRow, !canWithdraw ? styles.disabledAction : null]}
          >
            <View style={styles.actionIcon}>
              <Ionicons color={colors.deepGreen} name="cash-outline" size={20} />
            </View>
            <View style={styles.actionCopy}>
              <Text style={styles.actionTitle}>Withdraw to bank</Text>
              <Text style={styles.actionMeta}>{wallet.savedBank}</Text>
            </View>
            <Ionicons color={colors.muted} name="chevron-forward" size={18} />
          </TouchableOpacity>
        ) : null}

        <TouchableOpacity onPress={onRefresh} style={styles.actionRow}>
          <View style={styles.actionIcon}>
            <Ionicons color={colors.deepGreen} name="receipt-outline" size={20} />
          </View>
          <View style={styles.actionCopy}>
            <Text style={styles.actionTitle}>Wallet transactions</Text>
            <Text style={styles.actionMeta}>
              {wallet.ledger[0]
                ? `${wallet.ledger[0].direction === "credit" ? "+" : "-"}${formatNaira(
                    wallet.ledger[0].amountNaira
                  )} - ${wallet.ledger[0].status}`
                : "No wallet activity yet"}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      <Text style={styles.message}>{wallet.message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  accountRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    marginTop: 12
  },
  accountText: {
    color: "#b0f0d6",
    fontSize: 12,
    fontWeight: "800"
  },
  actionCopy: {
    flex: 1
  },
  actionIcon: {
    alignItems: "center",
    backgroundColor: colors.successSoft,
    borderRadius: 12,
    height: 40,
    justifyContent: "center",
    width: 40
  },
  actionList: {
    backgroundColor: colors.card,
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 12
  },
  actionMeta: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 3
  },
  actionRow: {
    alignItems: "center",
    borderBottomColor: colors.line,
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: 10,
    padding: 12
  },
  actionTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "900"
  },
  addButton: {
    alignItems: "center",
    backgroundColor: colors.orange,
    borderRadius: 999,
    flexDirection: "row",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  addButtonText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "900"
  },
  balanceCard: {
    backgroundColor: colors.greenContainer,
    borderRadius: 16,
    marginTop: 14,
    padding: 18
  },
  balanceLabel: {
    color: "#95d3ba",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  balanceValue: {
    color: "#b0f0d6",
    fontSize: 34,
    fontWeight: "900",
    marginTop: 5
  },
  bucket: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 12,
    flex: 1,
    padding: 12
  },
  bucketLabel: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: "900"
  },
  bucketRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10
  },
  bucketValue: {
    color: colors.deepGreen,
    fontSize: 15,
    fontWeight: "900",
    marginTop: 4
  },
  card: {
    backgroundColor: colors.card,
    borderColor: "rgba(191, 201, 195, 0.26)",
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 16,
    padding: 16
  },
  compactCard: {
    marginBottom: 12,
    marginTop: 0
  },
  disabledAction: {
    opacity: 0.48
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  headerActions: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8
  },
  iconButton: {
    alignItems: "center",
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 999,
    height: 34,
    justifyContent: "center",
    width: 34
  },
  kicker: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  message: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 18,
    marginTop: 10
  },
  title: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "900",
    marginTop: 2
  }
});
