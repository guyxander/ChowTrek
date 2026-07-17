import { supabase } from "../lib/supabase";

export type RoleVerificationRole = "merchant" | "delivery_agent";

export type ProfileCompletion = {
  phone: string;
  merchantVerificationAddress: string;
  agentVerificationAddress: string;
};

export type ProfileCompletionResult = {
  ok: boolean;
  message: string;
};

const buyerPhoneMessage = "Save your phone number on Profile before placing an order.";
const merchantCompletionMessage =
  "Save your phone number and private shop address on Profile before receiving merchant orders.";
const agentCompletionMessage =
  "Save your phone number and private home address on Profile before receiving delivery orders.";

export async function loadProfileCompletion(): Promise<
  | {
      ok: true;
      data: ProfileCompletion;
    }
  | {
      ok: false;
      message: string;
    }
> {
  const user = await getCurrentUserId("Sign in with Google to load profile requirements.");

  if (!user.ok) {
    return user;
  }

  const profileResult = await supabase!
    .from("profiles")
    .select("phone")
    .eq("id", user.id)
    .maybeSingle();

  if (profileResult.error) {
    return { ok: false, message: `Profile lookup failed: ${profileResult.error.message}` };
  }

  const verificationResult = await supabase!
    .from("role_verification_details")
    .select("role,verification_address")
    .eq("user_id", user.id);

  if (verificationResult.error) {
    return {
      ok: false,
      message: `Verification details need the latest Supabase patch: ${verificationResult.error.message}`
    };
  }

  const rows = verificationResult.data ?? [];

  return {
    ok: true,
    data: {
      phone: profileResult.data?.phone ?? "",
      merchantVerificationAddress:
        rows.find((row) => row.role === "merchant")?.verification_address ?? "",
      agentVerificationAddress:
        rows.find((row) => row.role === "delivery_agent")?.verification_address ?? ""
    }
  };
}

export async function saveProfilePhone(phone: string): Promise<ProfileCompletionResult> {
  const normalizedPhone = normalizePhone(phone);

  if (!isValidPhone(normalizedPhone)) {
    return { ok: false, message: "Enter a valid phone number before saving." };
  }

  const user = await getCurrentUserId("Sign in with Google before saving your phone number.");

  if (!user.ok) {
    return user;
  }

  const updateResult = await supabase!
    .from("profiles")
    .update({ phone: normalizedPhone })
    .eq("id", user.id)
    .select("id")
    .maybeSingle();

  if (updateResult.error) {
    return { ok: false, message: `Phone save failed: ${updateResult.error.message}` };
  }

  if (!updateResult.data) {
    const insertResult = await supabase!.from("profiles").insert({
      id: user.id,
      phone: normalizedPhone
    });

    if (insertResult.error) {
      return { ok: false, message: `Phone profile creation failed: ${insertResult.error.message}` };
    }
  }

  return { ok: true, message: "Phone number saved to your profile." };
}

export async function saveRoleVerificationAddress(
  role: RoleVerificationRole,
  address: string
): Promise<ProfileCompletionResult> {
  const trimmedAddress = address.trim();

  if (trimmedAddress.length < 8) {
    return {
      ok: false,
      message:
        role === "merchant"
          ? "Enter your full shop address before saving."
          : "Enter your full home address before saving."
    };
  }

  const user = await getCurrentUserId("Sign in with Google before saving verification details.");

  if (!user.ok) {
    return user;
  }

  const result = await supabase!
    .from("role_verification_details")
    .upsert(
      {
        user_id: user.id,
        role,
        verification_address: trimmedAddress
      },
      { onConflict: "user_id,role" }
    );

  if (result.error) {
    return { ok: false, message: `Verification address save failed: ${result.error.message}` };
  }

  return {
    ok: true,
    message:
      role === "merchant"
        ? "Private shop verification address saved."
        : "Private home verification address saved."
  };
}

export async function requireBuyerCanCheckout(): Promise<ProfileCompletionResult> {
  const user = await getCurrentUserId("Sign in with Google before checkout.");

  if (!user.ok) {
    return user;
  }

  const hasPhone = await userHasPhone(user.id);

  if (!hasPhone.ok) {
    return hasPhone;
  }

  return hasPhone.hasPhone ? allow() : { ok: false, message: buyerPhoneMessage };
}

export async function requireMerchantCanReceiveOrders(
  userId?: string
): Promise<ProfileCompletionResult> {
  const ownerId = userId ?? (await getCurrentUserId("Sign in with Google before merchant actions."));

  if (typeof ownerId !== "string") {
    if (!ownerId.ok) {
      return ownerId;
    }
    return { ok: false, message: merchantCompletionMessage };
  }

  const completion = await userHasPhoneAndRoleAddress(ownerId, "merchant");

  if (!completion.ok) {
    return completion;
  }

  return completion.complete ? allow() : { ok: false, message: merchantCompletionMessage };
}

export async function requireCurrentAgentCanReceiveOrders(): Promise<ProfileCompletionResult> {
  const user = await getCurrentUserId("Sign in with Google before delivery actions.");

  if (!user.ok) {
    return user;
  }

  const completion = await userHasPhoneAndRoleAddress(user.id, "delivery_agent");

  if (!completion.ok) {
    return completion;
  }

  return completion.complete ? allow() : { ok: false, message: agentCompletionMessage };
}

export async function requireMerchantCanReceiveOrderForMerchantId(
  merchantId: string
): Promise<ProfileCompletionResult> {
  const result = await supabase!.rpc("merchant_can_receive_orders", {
    target_merchant_id: merchantId
  });

  if (result.error) {
    return { ok: false, message: `Merchant verification lookup failed: ${result.error.message}` };
  }

  return result.data === true
    ? allow()
    : {
        ok: false,
        message: "This merchant is still completing verification and cannot receive orders yet."
      };
}

function normalizePhone(phone: string): string {
  return phone.trim().replace(/[^\d+]/g, "");
}

function isValidPhone(phone: string): boolean {
  const digitCount = phone.replace(/\D/g, "").length;
  return digitCount >= 7 && digitCount <= 15;
}

async function userHasPhone(
  userId: string
): Promise<{ ok: true; hasPhone: boolean } | { ok: false; message: string }> {
  const result = await supabase!.from("profiles").select("phone").eq("id", userId).maybeSingle();

  if (result.error) {
    return { ok: false, message: `Profile completion lookup failed: ${result.error.message}` };
  }

  return { ok: true, hasPhone: isValidPhone(result.data?.phone ?? "") };
}

async function userHasPhoneAndRoleAddress(
  userId: string,
  role: RoleVerificationRole
): Promise<{ ok: true; complete: boolean } | { ok: false; message: string }> {
  const phone = await userHasPhone(userId);

  if (!phone.ok) {
    return phone;
  }

  const addressResult = await supabase!
    .from("role_verification_details")
    .select("verification_address")
    .eq("user_id", userId)
    .eq("role", role)
    .maybeSingle();

  if (addressResult.error) {
    return {
      ok: false,
      message: `Role verification lookup failed: ${addressResult.error.message}`
    };
  }

  return {
    ok: true,
    complete: phone.hasPhone && (addressResult.data?.verification_address?.trim().length ?? 0) >= 8
  };
}

async function getCurrentUserId(
  unauthenticatedMessage: string
): Promise<{ ok: true; id: string } | { ok: false; message: string }> {
  if (!supabase) {
    return { ok: false, message: "Supabase is not configured for profile requirements." };
  }

  const { data, error } = await supabase.auth.getUser();

  if (error) {
    return { ok: false, message: `Session lookup failed: ${error.message}` };
  }

  if (!data.user) {
    return { ok: false, message: unauthenticatedMessage };
  }

  return { ok: true, id: data.user.id };
}

function allow(): ProfileCompletionResult {
  return { ok: true, message: "Profile requirements complete." };
}
