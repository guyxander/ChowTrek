import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

import { WalletPanel } from "../components/WalletPanel";
import { colors } from "../theme/colors";
import { WalletSummary } from "../types/domain";

type Props = {
  wallet: WalletSummary;
  onAddMoney: (amountNaira: number) => void;
  onBack: () => void;
  onRefresh: () => void;
};

export function WalletScreen({ onAddMoney, onBack, onRefresh, wallet }: Props) {
  const [topUpAmount, setTopUpAmount] = useState("5000");
  const amountNaira = Number(topUpAmount.replace(/[^\d]/g, ""));

  const submitTopUp = () => {
    onAddMoney(amountNaira);
  };

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

      <WalletPanel onAddMoney={() => onAddMoney(amountNaira)} onRefresh={onRefresh} title="ChowTrek Wallet" wallet={wallet} />

      <View style={styles.topUpCard}>
        <Text style={styles.topUpTitle}>Top up with card</Text>
        <Text style={styles.topUpCopy}>
          Enter an amount, then complete payment by card. Your top-up is recorded as pending until payment is verified.
        </Text>
        <View style={styles.amountRow}>
          <Text style={styles.amountPrefix}>NGN</Text>
          <TextInput
            keyboardType="number-pad"
            onChangeText={setTopUpAmount}
            placeholder="5000"
            placeholderTextColor={colors.muted}
            style={styles.amountInput}
            value={topUpAmount}
          />
        </View>
        <TouchableOpacity onPress={submitTopUp} style={styles.topUpButton}>
          <Ionicons color="#ffffff" name="card-outline" size={18} />
          <Text style={styles.topUpButtonText}>Pay with card</Text>
        </TouchableOpacity>
      </View>

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
  amountInput: {
    color: colors.text,
    flex: 1,
    fontSize: 16,
    fontWeight: "900",
    paddingVertical: 12
  },
  amountPrefix: {
    color: colors.deepGreen,
    fontSize: 13,
    fontWeight: "900"
  },
  amountRow: {
    alignItems: "center",
    backgroundColor: colors.surfaceContainerLow,
    borderColor: "rgba(191, 201, 195, 0.34)",
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
    paddingHorizontal: 12
  },
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
  },
  topUpButton: {
    alignItems: "center",
    backgroundColor: colors.orange,
    borderRadius: 10,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    marginTop: 12,
    paddingVertical: 13
  },
  topUpButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "900"
  },
  topUpCard: {
    backgroundColor: colors.card,
    borderColor: "rgba(191, 201, 195, 0.26)",
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 12,
    padding: 14
  },
  topUpCopy: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 19,
    marginTop: 4
  },
  topUpTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "900"
  }
});
