import { supabase } from "../lib/supabase";

type SnapshotRefresh = () => void;

const liveTables = [
  "merchant_profiles",
  "products",
  "orders",
  "deliveries",
  "vendor_followers",
  "vendor_timeline_events",
  "notification_preferences"
];

export function subscribeToCommerceChanges(onRefresh: SnapshotRefresh): () => void {
  if (!supabase) {
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

  channel.subscribe();

  return () => {
    void client.removeChannel(channel);
  };
}
