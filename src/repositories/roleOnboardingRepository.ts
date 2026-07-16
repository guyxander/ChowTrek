import { supabase } from "../lib/supabase";

export type RoleOnboardingResult = {
  ok: true;
  message: string;
} | {
  ok: false;
  message: string;
};

type RoleRecord = "merchant" | "delivery_agent";
type UserLookupResult = { ok: true; id: string } | { ok: false; message: string };

export async function activateMerchantProfile(): Promise<RoleOnboardingResult> {
  const user = await getCurrentUserId();

  if (!user.ok) {
    return user;
  }

  const profileResult = await ensureProfileRole(user.id, "merchant");

  if (!profileResult.ok) {
    return profileResult;
  }

  const existing = await supabase!
    .from("merchant_profiles")
    .select("id")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (existing.error) {
    return failure(`Merchant lookup failed: ${existing.error.message}`);
  }

  if (existing.data) {
    return { ok: true, message: "Merchant workspace is already active for this account." };
  }

  const result = await supabase!.from("merchant_profiles").insert({
    owner_id: user.id,
    business_name: "My ChowTrek Store",
    description: "Local food vendor",
    neighborhood: "Nearby",
    is_approved: false
  });

  if (result.error) {
    return failure(`Merchant activation failed: ${result.error.message}`);
  }

  return {
    ok: true,
    message: "Merchant workspace created. Admin approval is still required before public listing."
  };
}

export async function activateAgentProfile(): Promise<RoleOnboardingResult> {
  const user = await getCurrentUserId();

  if (!user.ok) {
    return user;
  }

  const profileResult = await ensureProfileRole(user.id, "delivery_agent");

  if (!profileResult.ok) {
    return profileResult;
  }

  const existing = await supabase!
    .from("delivery_agent_profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing.error) {
    return failure(`Agent lookup failed: ${existing.error.message}`);
  }

  if (existing.data) {
    return { ok: true, message: "Delivery agent workspace is already active for this account." };
  }

  const result = await supabase!.from("delivery_agent_profiles").insert({
    user_id: user.id,
    is_verified: false,
    is_available: false,
    rating: 5
  });

  if (result.error) {
    return failure(`Agent activation failed: ${result.error.message}`);
  }

  return {
    ok: true,
    message: "Delivery agent profile created. Verification is required before claiming deliveries."
  };
}

async function ensureProfileRole(
  profileId: string,
  role: RoleRecord
): Promise<RoleOnboardingResult> {
  const result = await supabase!.from("profile_roles").upsert(
    {
      profile_id: profileId,
      role,
      is_approved: false
    },
    { ignoreDuplicates: true, onConflict: "profile_id,role" }
  );

  if (result.error) {
    return failure(`Role request failed: ${result.error.message}`);
  }

  return { ok: true, message: "Role request saved." };
}

async function getCurrentUserId(): Promise<UserLookupResult> {
  if (!supabase) {
    return failure("Supabase is not configured for role activation.");
  }

  const { data, error } = await supabase.auth.getUser();

  if (error) {
    return failure(`Session lookup failed: ${error.message}`);
  }

  if (!data.user) {
    return failure("Sign in with Google before activating this role.");
  }

  return { ok: true, id: data.user.id };
}

function failure(message: string): { ok: false; message: string } {
  return { ok: false, message };
}
