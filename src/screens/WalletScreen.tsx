import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { WalletPanel } from "../components/WalletPanel";
import { colors } from "../theme/colors";
import { WalletSummary } from "../types/domain";

type Props = {
  wallet: WalletSummary;
  onAddMoney: () => void;
  onBack: () => void;
  onRefresh: () => void;
};

export function WalletScreen({ onAddMoney, onBack, onRefresh, wallet }: Props) {
  return (
    <View>
      <View style={styles.topBar}>
        <TouchableOpacity accessibilityLabel="Back to profile" onPress={onBack} style={styles.iconButton}>
          <Ionicons color={colors.text} name="chevron-back" size={22} />
        </TouchableOpacity>
        <Text style={styles.title}>Wallet</Text>
        <TouchableOpacity accessibilityLabel="Refresh wallet" onPress={onRefresh} style={styles.iconButton}>
          <Ionicons color={colors.deepGreen} name="refresh" size={20} />
        </TouchableOpacity>
      </View>

      <WalletPanel onAddMoney={onAddMoney} onRefresh={onRefresh} title="ChowTrek Wallet" wallet={wallet} />

      <View style={styles.noteCard}>
        <Ionicons color={colors.deepGreen} name="shield-checkmark-outline" size={22} />
        <View style={styles.noteCopy}>
          <Text style={styles.noteTitle}>Wallet keeps checkout faster</Text>
          <Text style={styles.noteText}>
            Top up before ordering, pay from your balance, and track every ChowTrek wallet activity here.
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  iconButton: {
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: 999,
    height: 40,
    justifyContent: "center",
    width: 40
  },
  noteCard: {
    alignItems: "flex-start",
    backgroundColor: colors.successSoft,
    borderRadius: 14,
    flexDirection: "row",
    gap: 12,
    marginTop: 14,
    padding: 14
  },
  noteCopy: {
    flex: 1
  },
  noteText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 19,
    marginTop: 4
  },
  noteTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "900"
  },
  title: {
    color: colors.text,
    flex: 1,
    fontSize: 22,
    fontWeight: "900",
    textAlign: "center"
  },
  topBar: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    marginBottom: 4,
    paddingVertical: 4
  }
});
