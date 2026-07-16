import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { colors } from "../theme/colors";
import { sharedStyles } from "../theme/sharedStyles";
import { AgentOpportunity } from "../types/domain";
import { formatNaira } from "../utils/money";

type Props = {
  onBack: () => void;
  agentOpportunities: AgentOpportunity[];
  isAvailable: boolean;
  claimedOpportunityIds: string[];
  pickedUpOpportunityIds: string[];
  deliveredOpportunityIds: string[];
  onToggleAvailability: () => void;
  onToggleOpportunityClaim: (opportunityId: string) => void;
  onMarkPickedUp: (opportunityId: string) => void;
  onMarkDelivered: (opportunityId: string) => void;
};

export function AgentScreen({
  agentOpportunities,
  claimedOpportunityIds,
  deliveredOpportunityIds,
  isAvailable,
  onBack,
  onMarkDelivered,
  onMarkPickedUp,
  onToggleAvailability,
  onToggleOpportunityClaim,
  pickedUpOpportunityIds
}: Props) {
  return (
    <View>
      <TouchableOpacity onPress={onBack} style={styles.backButton}>
        <Ionicons color={colors.deepGreen} name="chevron-back" size={20} />
        <Text style={styles.backText}>Profile</Text>
      </TouchableOpacity>
      <Text style={sharedStyles.screenTitle}>Agent</Text>
      <View style={sharedStyles.card}>
        <View style={styles.agentHeader}>
          <View>
            <Text style={sharedStyles.cardTitle}>Available for deliveries</Text>
            <Text style={sharedStyles.bodyCopy}>Eligibility uses Agent -&gt; Merchant -&gt; Customer route.</Text>
          </View>
          <TouchableOpacity
            onPress={onToggleAvailability}
            style={[styles.toggleOn, !isAvailable ? styles.toggleOff : null]}
          >
            <Text style={styles.toggleText}>{isAvailable ? "ON" : "OFF"}</Text>
          </TouchableOpacity>
        </View>
      </View>
      {agentOpportunities.length > 0 ? (
        agentOpportunities.map((opportunity) => (
          <View key={opportunity.id} style={sharedStyles.card}>
            {(() => {
              const isClaimed = claimedOpportunityIds.includes(opportunity.id);
              const isPickedUp = pickedUpOpportunityIds.includes(opportunity.id);
              const isDelivered = deliveredOpportunityIds.includes(opportunity.id);
              const stage = isDelivered ? "Delivered" : isPickedUp ? "Picked Up" : isClaimed ? "Claimed" : "Open";

              return (
                <>
          <View style={styles.cardHeader}>
            <Text style={sharedStyles.cardTitle}>{opportunity.route}</Text>
            <Text style={styles.eligibility}>{opportunity.eligibility}</Text>
          </View>
          <Text style={styles.stageText}>Stage: {stage}</Text>
          <View style={sharedStyles.inlineMeta}>
            <Ionicons color={colors.deepGreen} name="navigate-outline" size={18} />
            <Text style={sharedStyles.metaText}>{opportunity.distanceKm} km</Text>
            <Text style={styles.payout}>{formatNaira(opportunity.payoutNaira)}</Text>
          </View>
          <TouchableOpacity
            disabled={!isAvailable}
            onPress={() => onToggleOpportunityClaim(opportunity.id)}
            style={[
              styles.claimButton,
              claimedOpportunityIds.includes(opportunity.id) ? styles.claimedButton : null,
              !isAvailable ? styles.disabledClaimButton : null
            ]}
          >
            <Text style={styles.claimButtonText}>
              {isClaimed ? "Release delivery" : "Claim delivery"}
            </Text>
          </TouchableOpacity>
          <View style={styles.actionRow}>
            <TouchableOpacity
              disabled={!isClaimed || isPickedUp}
              onPress={() => onMarkPickedUp(opportunity.id)}
              style={[styles.stageButton, !isClaimed || isPickedUp ? styles.disabledClaimButton : null]}
            >
              <Text style={styles.stageButtonText}>Pickup proof</Text>
            </TouchableOpacity>
            <TouchableOpacity
              disabled={!isPickedUp || isDelivered}
              onPress={() => onMarkDelivered(opportunity.id)}
              style={[styles.stageButton, !isPickedUp || isDelivered ? styles.disabledClaimButton : null]}
            >
              <Text style={styles.stageButtonText}>Delivered</Text>
            </TouchableOpacity>
          </View>
                </>
              );
            })()}
          </View>
        ))
      ) : (
        <View style={sharedStyles.card}>
          <Text style={sharedStyles.cardTitle}>No delivery opportunities</Text>
          <Text style={sharedStyles.bodyCopy}>
            New assigned or open delivery requests will appear here when vendors hand over orders.
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  agentHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between"
  },
  actionRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10
  },
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
  cardHeader: {
    gap: 8
  },
  claimButton: {
    alignItems: "center",
    backgroundColor: colors.deepGreen,
    borderRadius: 8,
    marginTop: 14,
    paddingVertical: 12
  },
  claimButtonText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "900"
  },
  stageButton: {
    alignItems: "center",
    borderColor: colors.deepGreen,
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    paddingVertical: 10
  },
  stageButtonText: {
    color: colors.deepGreen,
    fontSize: 12,
    fontWeight: "900"
  },
  stageText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "900",
    marginTop: 8
  },
  claimedButton: {
    backgroundColor: colors.orange
  },
  disabledClaimButton: {
    opacity: 0.45
  },
  eligibility: {
    alignSelf: "flex-start",
    backgroundColor: colors.successSoft,
    borderRadius: 999,
    color: colors.greenContainer,
    fontSize: 12,
    fontWeight: "800",
    paddingHorizontal: 10,
    paddingVertical: 5
  },
  payout: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "800",
    marginLeft: "auto"
  },
  toggleOn: {
    backgroundColor: colors.emerald,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7
  },
  toggleOff: {
    backgroundColor: colors.muted
  },
  toggleText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "900"
  }
});
