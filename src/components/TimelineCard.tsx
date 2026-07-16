import { StyleSheet, Text, View } from "react-native";

import { colors } from "../theme/colors";
import { sharedStyles } from "../theme/sharedStyles";
import { TimelineEvent } from "../types/domain";
import { StatusBadge } from "./StatusBadge";

type Props = {
  event: TimelineEvent;
};

export function TimelineCard({ event }: Props) {
  return (
    <View style={sharedStyles.card}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={sharedStyles.cardTitle}>{event.vendor}</Text>
          <Text style={sharedStyles.subtle}>{event.type}</Text>
        </View>
        <StatusBadge status={event.status} />
      </View>
      <Text style={styles.eventTitle}>{event.title}</Text>
      <Text style={sharedStyles.bodyCopy}>{event.body}</Text>
      <Text style={styles.timeText}>{event.minutesAgo} min ago</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  cardHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    justifyContent: "space-between",
    marginBottom: 8
  },
  eventTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 4
  },
  timeText: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 10
  }
});
