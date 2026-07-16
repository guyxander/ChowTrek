import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";

import { colors } from "../theme/colors";
import { sharedStyles } from "../theme/sharedStyles";
import { TimelineEvent } from "../types/domain";

type Props = {
  timelineEvents: TimelineEvent[];
};

export function CommunityScreen({ timelineEvents }: Props) {
  return (
    <View>
      <Text style={sharedStyles.screenTitle}>Community</Text>
      <View style={sharedStyles.card}>
        <Text style={sharedStyles.cardTitle}>Merchant neighborhood posts</Text>
        <Text style={sharedStyles.bodyCopy}>
          Local updates, comments, and discovery-focused discussions from nearby businesses.
        </Text>
      </View>
      {timelineEvents.map((event) => (
        <View key={`${event.id}-community`} style={sharedStyles.card}>
          <Text style={sharedStyles.cardTitle}>{event.vendor}</Text>
          <Text style={sharedStyles.bodyCopy}>{event.body}</Text>
          <View style={sharedStyles.inlineMeta}>
            <Ionicons color={colors.deepGreen} name="chatbubble-outline" size={18} />
            <Text style={sharedStyles.metaText}>Neighborhood discussion</Text>
          </View>
        </View>
      ))}
    </View>
  );
}
