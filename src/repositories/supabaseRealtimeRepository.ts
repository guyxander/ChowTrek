import { supabase } from "../lib/supabase";

type SnapshotRefresh = () => void;
type StatusChange = (message: string) => void;

const liveTables = [
  "merchant_profiles",
  "products",
  "orders",
  "deliveries",
  "vendor_followers",
  "vendor_timeline_events",
  "notification_preferences"
];

export function subscribeToCommerceChanges(
  onRefresh: SnapshotRefresh,
  onStatusChange?: StatusChange
): () => void {
  if (!supabase) {
    onStatusChange?.("Realtime is disabled because Supabase is not configured.");
    return () => undefined;
  }

  const client = supabase;
  const channel = client.channel("commerce-snapshot");

  liveTables.forEach((table) => {
    channel.on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table
      },
      onRefresh
    );
  });

  channel.subscribe((status) => {
    if (status === "SUBSCRIBED") {
      onStatusChange?.("Realtime updates are connected.");
    }

    if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
      onStatusChange?.(`Realtime updates are ${status.toLowerCase().replace("_", " ")}.`);
    }
  });

  return () => {
    void client.removeChannel(channel);
  };
}
