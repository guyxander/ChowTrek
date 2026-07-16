import { supabase } from "../lib/supabase";
import { AdminMetric, AdminQueueItem } from "../types/domain";

type MerchantApprovalRow = {
  id: string;
  business_name: string;
  neighborhood: string | null;
  is_approved: boolean;
};

type AgentApprovalRow = {
  id: string;
  is_verified: boolean;
  profiles?: { display_name: string | null } | { display_name: string | null }[] | null;
};

export type AdminDashboardResult =
  | {
      ok: true;
      metrics: AdminMetric[];
      queue: AdminQueueItem[];
      message: string;
    }
  | {
      ok: false;
      metrics: AdminMetric[];
      queue: AdminQueueItem[];
      message: string;
    };

export type AdminActionResult = {
  ok: boolean;
  message: string;
};

export async function loadAdminDashboard(): Promise<AdminDashboardResult> {
  const emptyMetrics: AdminMetric[] = [
    { label: "Pending merchants", value: "0", detail: "Waiting for admin approval" },
    { label: "Pending agents", value: "0", detail: "Waiting for verification" },
    { label: "Open disputes", value: "0", detail: "Dispute workflow pending server support" }
  ];

  if (!supabase) {
    return {
      ok: false,
      metrics: emptyMetrics,
      queue: [],
      message: "Supabase is not configured for admin operations."
    };
  }

  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError) {
    return {
      ok: false,
      metrics: emptyMetrics,
      queue: [],
      message: `Admin session lookup failed: ${userError.message}`
    };
  }

  if (!user) {
    return {
      ok: false,
      metrics: emptyMetrics,
      queue: [],
      message: "Sign in with an approved admin Google account to load admin queues."
    };
  }

  const [merchantResult, agentResult] = await Promise.all([
    supabase
      .from("merchant_profiles")
      .select("id,business_name,neighborhood,is_approved")
      .eq("is_approved", false)
      .limit(20),
    supabase
      .from("delivery_agent_profiles")
      .select("id,is_verified,profiles(display_name)")
      .eq("is_verified", false)
      .limit(20)
  ]);

  if (merchantResult.error || agentResult.error) {
    return {
      ok: false,
      metrics: emptyMetrics,
      queue: [],
      message:
        merchantResult.error?.message ??
        agentResult.error?.message ??
        "Admin queue failed to load."
    };
  }

  const merchants = (merchantResult.data ?? []) as MerchantApprovalRow[];
  const agents = (agentResult.data ?? []) as unknown as AgentApprovalRow[];
  const queue: AdminQueueItem[] = [
    ...merchants.map((merchant) => ({
      id: merchant.id,
      label: merchant.business_name,
      detail: merchant.neighborhood ?? "No neighborhood supplied",
      state: "Open" as const,
      kind: "merchant" as const
    })),
    ...agents.map((agent) => ({
      id: agent.id,
      label: getProfileName(agent.profiles) ?? "Delivery agent",
      detail: "Identity and delivery readiness verification required",
      state: "Open" as const,
      kind: "agent" as const
    }))
  ];

  return {
    ok: true,
    metrics: [
      {
        label: "Pending merchants",
        value: String(merchants.length),
        detail: "Awaiting storefront review"
      },
      {
        label: "Pending agents",
        value: String(agents.length),
        detail: "Awaiting identity verification"
      },
      {
        label: "Open disputes",
        value: "0",
        detail: "Dispute tables are not enabled yet"
      }
    ],
    queue,
    message: "Admin queues loaded from Supabase."
  };
}

export async function approveAdminQueueItem(item: AdminQueueItem): Promise<AdminActionResult> {
  if (!supabase) {
    return { ok: false, message: "Supabase is not configured for admin approval." };
  }

  const table = item.kind === "merchant" ? "merchant_profiles" : "delivery_agent_profiles";
  const update =
    item.kind === "merchant"
      ? { is_approved: true }
      : { is_verified: true, is_available: true };

  if (item.kind !== "merchant" && item.kind !== "agent") {
    return { ok: false, message: "This admin queue item is not approvable in the mobile app." };
  }

  const result = await supabase.from(table).update(update).eq("id", item.id).select("id").maybeSingle();

  if (result.error) {
    return { ok: false, message: `Admin approval failed: ${result.error.message}` };
  }

  if (!result.data) {
    return {
      ok: false,
      message: "Admin approval was not allowed. Confirm this account has an approved admin role."
    };
  }

  return { ok: true, message: `${item.label} approved.` };
}

function getProfileName(
  value: { display_name: string | null } | { display_name: string | null }[] | null | undefined
): string | null {
  const profile = Array.isArray(value) ? value[0] : value;

  return profile?.display_name ?? null;
}
