import { Ionicons } from "@expo/vector-icons";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { WalletPanel } from "../components/WalletPanel";
import { colors } from "../theme/colors";
import { AgentOpportunity, WalletSummary } from "../types/domain";
import { formatNaira } from "../utils/money";

const agentAvatar =
  "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=240&q=80";

type Props = {
  onBack: () => void;
  agentOpportunities: AgentOpportunity[];
  isAvailable: boolean;
  claimedOpportunityIds: string[];
  pickedUpOpportunityIds: string[];
  deliveredOpportunityIds: string[];
  wallet: WalletSummary;
  onToggleAvailability: () => void;
  onToggleOpportunityClaim: (opportunityId: string) => void;
  onMarkPickedUp: (opportunityId: string) => void;
  onMarkDelivered: (opportunityId: string) => void;
  onWalletRefresh: () => void;
  onWalletWithdraw: (amountNaira: number) => void;
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
  onWalletRefresh,
  onWalletWithdraw,
  pickedUpOpportunityIds,
  wallet
}: Props) {
  const claimedCount = claimedOpportunityIds.length;
  const completedCount = deliveredOpportunityIds.length;
  const visibleOpportunities = agentOpportunities.slice(0, 3);

  return (
    <View style={styles.screen}>
      <View style={styles.topBar}>
        <View style={styles.identity}>
          <Image source={{ uri: agentAvatar }} style={styles.avatar} />
          <View>
            <Text style={styles.roleEyebrow}>Delivery workspace</Text>
            <Text style={styles.title}>ChowTrek Agent</Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={onToggleAvailability}
          style={[styles.statusPill, !isAvailable ? styles.offlinePill : null]}
        >
          <View style={[styles.statusDot, !isAvailable ? styles.offlineDot : null]} />
          <Text style={[styles.statusText, !isAvailable ? styles.offlineText : null]}>
            {isAvailable ? "Online" : "Offline"}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.earningsCard}>
        <Text style={styles.kicker}>Today's earnings</Text>
        <Text style={styles.earningsValue}>
          {formatNaira(agentOpportunities.reduce((sum, item) => sum + item.payoutNaira, 0))}
        </Text>
        <View style={styles.trendRow}>
          <Ionicons color={colors.deepGreen} name="trending-up" size={18} />
          <Text style={styles.trendText}>12% more than yesterday</Text>
        </View>
      </View>
      <WalletPanel
        onRefresh={onWalletRefresh}
        onWithdraw={onWalletWithdraw}
        title="Delivery payouts"
        wallet={wallet}
      />

      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>Hot Zones</Text>
          <Text style={styles.sectionSubtle}>High demand in these areas</Text>
        </View>
        <TouchableOpacity style={styles.iconButton}>
          <Ionicons color={colors.deepGreen} name="locate" size={22} />
        </TouchableOpacity>
      </View>

      <View style={styles.mapCard}>
        <View style={styles.mapGrid}>
          <View style={[styles.mapRoad, styles.mapRoadOne]} />
          <View style={[styles.mapRoad, styles.mapRoadTwo]} />
          <View style={[styles.mapRoad, styles.mapRoadThree]} />
          <View style={[styles.heatRing, styles.heatRingLarge]}>
            <View style={styles.heatCore}>
              <Ionicons color="#ffffff" name="flame" size={18} />
            </View>
          </View>
          <View style={[styles.heatRing, styles.heatRingSmall]} />
        </View>
        <View style={styles.mapBadge}>
          <View style={styles.orangeDot} />
          <Text style={styles.mapBadgeText}>Victoria Island: High</Text>
        </View>
      </View>

      <View style={styles.routeCard}>
        <View style={styles.routeIcon}>
          <Ionicons color={colors.deepGreen} name="navigate" size={28} />
        </View>
        <View style={styles.routeContent}>
          <Text style={styles.routeTitle}>Next Best Area</Text>
          <Text style={styles.routeText}>
            Head over to <Text style={styles.routeHighlight}>Ikoyi Hub</Text>. Expected wait time
            for next order is less than 5 mins.
          </Text>
          <TouchableOpacity style={styles.routeButton}>
            <Text style={styles.routeButtonText}>Route me there</Text>
            <Ionicons color="#ffffff" name="arrow-forward" size={18} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.statGrid}>
        <StatCard icon="time" label="Active Hours" value="4h 20m" tone="orange" />
        <StatCard icon="checkmark-circle" label="Completed" value={`${completedCount} Orders`} tone="green" />
        <StatCard icon="cube" label="Claimed" value={`${claimedCount} Active`} tone="green" />
        <StatCard icon="cash" label="Open Payout" value={formatNaira(visibleOpportunities[0]?.payoutNaira ?? 0)} tone="orange" />
      </View>

      <Text style={styles.sectionTitle}>Delivery Queue</Text>
      {visibleOpportunities.length > 0 ? (
        visibleOpportunities.map((opportunity) => {
          const isClaimed = claimedOpportunityIds.includes(opportunity.id);
          const isPickedUp = pickedUpOpportunityIds.includes(opportunity.id);
          const isDelivered = deliveredOpportunityIds.includes(opportunity.id);
          const stage = isDelivered ? "Delivered" : isPickedUp ? "Picked Up" : isClaimed ? "Claimed" : "Open";

          return (
            <View key={opportunity.id} style={styles.deliveryCard}>
              <View style={styles.deliveryHeader}>
                <View style={styles.deliveryIcon}>
                  <Ionicons color={colors.deepGreen} name="bicycle" size={22} />
                </View>
                <View style={styles.deliveryContent}>
                  <Text style={styles.deliveryRoute}>{opportunity.route}</Text>
                  <Text style={styles.deliveryMeta}>
                    {opportunity.distanceKm} km - {formatNaira(opportunity.payoutNaira)}
                  </Text>
                </View>
                <Text style={styles.stageBadge}>{stage}</Text>
              </View>
              <TouchableOpacity
                disabled={!isAvailable}
                onPress={() => onToggleOpportunityClaim(opportunity.id)}
                style={[
                  styles.primaryAction,
                  isClaimed ? styles.orangeAction : null,
                  !isAvailable ? styles.disabledAction : null
                ]}
              >
                <Text style={styles.primaryActionText}>
                  {isClaimed ? "Release delivery" : "Claim delivery"}
                </Text>
              </TouchableOpacity>
              <View style={styles.actionRow}>
                <TouchableOpacity
                  disabled={!isClaimed || isPickedUp}
                  onPress={() => onMarkPickedUp(opportunity.id)}
                  style={[styles.secondaryAction, !isClaimed || isPickedUp ? styles.disabledAction : null]}
                >
                  <Text style={styles.secondaryActionText}>Pickup proof</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  disabled={!isPickedUp || isDelivered}
                  onPress={() => onMarkDelivered(opportunity.id)}
                  style={[styles.secondaryAction, !isPickedUp || isDelivered ? styles.disabledAction : null]}
                >
                  <Text style={styles.secondaryActionText}>Delivered</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })
      ) : (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No delivery opportunities</Text>
          <Text style={styles.sectionSubtle}>
            New assigned or open delivery requests will appear here when vendors hand over orders.
          </Text>
        </View>
      )}
    </View>
  );
}

function StatCard({
  icon,
  label,
  tone,
  value
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  tone: "green" | "orange";
  value: string;
}) {
  return (
    <View style={styles.statCard}>
      <Ionicons color={tone === "green" ? colors.deepGreen : colors.orange} name={icon} size={22} />
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10
  },
  avatar: {
    borderRadius: 20,
    height: 40,
    width: 40
  },
  deliveryCard: {
    backgroundColor: colors.card,
    borderColor: "rgba(191, 201, 195, 0.28)",
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 12,
    padding: 14
  },
  deliveryContent: {
    flex: 1
  },
  deliveryHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10
  },
  deliveryIcon: {
    alignItems: "center",
    backgroundColor: "rgba(176, 240, 214, 0.28)",
    borderRadius: 12,
    height: 44,
    justifyContent: "center",
    width: 44
  },
  deliveryMeta: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 4
  },
  deliveryRoute: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "900"
  },
  disabledAction: {
    opacity: 0.45
  },
  earningsCard: {
    alignItems: "center",
    backgroundColor: colors.card,
    borderColor: "rgba(191, 201, 195, 0.22)",
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 16,
    overflow: "hidden",
    padding: 22
  },
  earningsValue: {
    color: colors.deepGreen,
    fontSize: 32,
    fontWeight: "900",
    marginTop: 4
  },
  emptyCard: {
    backgroundColor: colors.card,
    borderRadius: 14,
    marginTop: 12,
    padding: 16
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "900",
    marginBottom: 4
  },
  heatCore: {
    alignItems: "center",
    backgroundColor: colors.orange,
    borderRadius: 24,
    height: 48,
    justifyContent: "center",
    width: 48
  },
  heatRing: {
    alignItems: "center",
    backgroundColor: "rgba(249, 115, 22, 0.24)",
    borderRadius: 999,
    justifyContent: "center",
    position: "absolute"
  },
  heatRingLarge: {
    height: 112,
    left: "38%",
    top: "26%",
    width: 112
  },
  heatRingSmall: {
    bottom: "18%",
    height: 72,
    right: "16%",
    width: 72
  },
  iconButton: {
    alignItems: "center",
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 10,
    height: 40,
    justifyContent: "center",
    width: 40
  },
  identity: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12
  },
  kicker: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  mapBadge: {
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.86)",
    borderRadius: 999,
    bottom: 14,
    flexDirection: "row",
    gap: 8,
    left: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    position: "absolute"
  },
  mapBadgeText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "900"
  },
  mapCard: {
    borderRadius: 16,
    height: 286,
    marginTop: 14,
    overflow: "hidden"
  },
  mapGrid: {
    backgroundColor: "#dce2f3",
    flex: 1
  },
  mapRoad: {
    backgroundColor: "rgba(21, 28, 39, 0.18)",
    borderRadius: 999,
    height: 12,
    position: "absolute"
  },
  mapRoadOne: {
    left: -20,
    top: 64,
    transform: [{ rotate: "18deg" }],
    width: 360
  },
  mapRoadThree: {
    bottom: 52,
    left: 12,
    transform: [{ rotate: "-8deg" }],
    width: 250
  },
  mapRoadTwo: {
    height: 180,
    right: 94,
    top: 28,
    transform: [{ rotate: "38deg" }],
    width: 12
  },
  offlineDot: {
    backgroundColor: colors.muted
  },
  offlinePill: {
    backgroundColor: colors.surfaceContainerLow
  },
  offlineText: {
    color: colors.muted
  },
  orangeAction: {
    backgroundColor: colors.orange
  },
  orangeDot: {
    backgroundColor: colors.orange,
    borderRadius: 4,
    height: 8,
    width: 8
  },
  primaryAction: {
    alignItems: "center",
    backgroundColor: colors.deepGreen,
    borderRadius: 10,
    marginTop: 14,
    paddingVertical: 12
  },
  primaryActionText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "900"
  },
  roleEyebrow: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  routeButton: {
    alignItems: "center",
    backgroundColor: colors.orange,
    borderRadius: 10,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    marginTop: 14,
    paddingVertical: 12
  },
  routeButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "900"
  },
  routeCard: {
    backgroundColor: colors.greenContainer,
    borderRadius: 16,
    flexDirection: "row",
    gap: 14,
    marginTop: 22,
    overflow: "hidden",
    padding: 18
  },
  routeContent: {
    flex: 1
  },
  routeHighlight: {
    color: "#ffffff",
    fontWeight: "900"
  },
  routeIcon: {
    alignItems: "center",
    backgroundColor: colors.secondaryFixed,
    borderRadius: 12,
    height: 54,
    justifyContent: "center",
    width: 54
  },
  routeText: {
    color: "#95d3ba",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4
  },
  routeTitle: {
    color: "#b0f0d6",
    fontSize: 20,
    fontWeight: "900"
  },
  screen: {
    gap: 0
  },
  secondaryAction: {
    alignItems: "center",
    borderColor: colors.deepGreen,
    borderRadius: 10,
    borderWidth: 1,
    flex: 1,
    paddingVertical: 10
  },
  secondaryActionText: {
    color: colors.deepGreen,
    fontSize: 12,
    fontWeight: "900"
  },
  sectionHeader: {
    alignItems: "flex-end",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 24
  },
  sectionSubtle: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "700",
    marginTop: 2
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "900",
    marginTop: 22
  },
  stageBadge: {
    backgroundColor: colors.warningSoft,
    borderRadius: 999,
    color: colors.orange,
    fontSize: 11,
    fontWeight: "900",
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  statCard: {
    backgroundColor: colors.surfaceContainerLow,
    borderColor: "rgba(191, 201, 195, 0.16)",
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    width: "48%"
  },
  statGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 22,
    rowGap: 12
  },
  statLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "800",
    marginTop: 8
  },
  statValue: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "900",
    marginTop: 2
  },
  statusDot: {
    backgroundColor: colors.deepGreen,
    borderRadius: 4,
    height: 8,
    width: 8
  },
  statusPill: {
    alignItems: "center",
    backgroundColor: "rgba(176, 240, 214, 0.34)",
    borderRadius: 999,
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7
  },
  statusText: {
    color: colors.deepGreen,
    fontSize: 12,
    fontWeight: "900"
  },
  title: {
    color: colors.deepGreen,
    fontSize: 20,
    fontWeight: "900"
  },
  topBar: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  trendRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
    marginTop: 8
  },
  trendText: {
    color: colors.deepGreen,
    fontSize: 12,
    fontWeight: "900"
  }
});
