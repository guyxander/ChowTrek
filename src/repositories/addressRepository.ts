import { supabase } from "../lib/supabase";
import { SavedAddress } from "../types/domain";

type AddressRow = {
  id: string;
  label: string;
  address_line: string;
  latitude: number | null;
  longitude: number | null;
};

export type AddressMutationResult = {
  address?: SavedAddress;
  message: string;
  ok: boolean;
};

export const fallbackAddresses: SavedAddress[] = [
  {
    id: "lekki-home",
    label: "Home",
    detail: "Lekki Phase 1",
    area: "Around Lekki Phase 1",
    distanceBiasKm: 0
  },
  {
    id: "vi-office",
    label: "Work",
    detail: "Victoria Island",
    area: "Around Victoria Island",
    distanceBiasKm: 1.1
  }
];

export async function loadSavedAddresses(): Promise<{
  addresses: SavedAddress[];
  message?: string;
}> {
  if (!supabase) {
    return {
      addresses: fallbackAddresses,
      message: "Supabase is not configured. Showing local saved addresses."
    };
  }

  const userResult = await supabase.auth.getUser();
  const userId = userResult.data.user?.id;

  if (!userId) {
    return {
      addresses: fallbackAddresses,
      message: "Sign in with Google to sync saved delivery addresses."
    };
  }

  const { data, error } = await supabase
    .from("addresses")
    .select("id,label,address_line,latitude,longitude")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) {
    return {
      addresses: fallbackAddresses,
      message: `Saved addresses unavailable: ${error.message}`
    };
  }

  const addresses = ((data ?? []) as AddressRow[]).map(mapAddressRow);

  return {
    addresses: addresses.length > 0 ? addresses : fallbackAddresses,
    message: addresses.length > 0 ? "Saved addresses synced." : "Add a saved address to sync it here."
  };
}

export async function createSavedAddress(label: string, addressLine: string): Promise<AddressMutationResult> {
  const normalizedLabel = label.trim();
  const normalizedAddressLine = addressLine.trim();

  if (!normalizedLabel || !normalizedAddressLine) {
    return {
      message: "Enter both an address label and delivery address.",
      ok: false
    };
  }

  if (!supabase) {
    return {
      address: buildLocalAddress(normalizedLabel, normalizedAddressLine),
      message: "Address added locally. Configure Supabase to sync it.",
      ok: true
    };
  }

  const userResult = await supabase.auth.getUser();
  const userId = userResult.data.user?.id;

  if (!userId) {
    return {
      address: buildLocalAddress(normalizedLabel, normalizedAddressLine),
      message: "Address added locally. Sign in with Google to sync it.",
      ok: true
    };
  }

  const { data, error } = await supabase
    .from("addresses")
    .insert({
      user_id: userId,
      label: normalizedLabel,
      address_line: normalizedAddressLine
    })
    .select("id,label,address_line,latitude,longitude")
    .single();

  if (error) {
    return {
      message: `Address was not saved: ${error.message}`,
      ok: false
    };
  }

  return {
    address: mapAddressRow(data as AddressRow),
    message: "Address saved to Supabase.",
    ok: true
  };
}

export async function updateSavedAddress(
  addressId: string,
  label: string,
  addressLine: string
): Promise<AddressMutationResult> {
  const normalizedLabel = label.trim();
  const normalizedAddressLine = addressLine.trim();

  if (!normalizedLabel || !normalizedAddressLine) {
    return {
      message: "Enter both an address label and delivery address.",
      ok: false
    };
  }

  if (!supabase) {
    return {
      address: {
        ...buildLocalAddress(normalizedLabel, normalizedAddressLine),
        id: addressId
      },
      message: "Address updated locally. Configure Supabase to sync it.",
      ok: true
    };
  }

  const userResult = await supabase.auth.getUser();
  const userId = userResult.data.user?.id;

  if (!userId) {
    return {
      address: {
        ...buildLocalAddress(normalizedLabel, normalizedAddressLine),
        id: addressId
      },
      message: "Address updated locally. Sign in with Google to sync changes.",
      ok: true
    };
  }

  const { data, error } = await supabase
    .from("addresses")
    .update({
      label: normalizedLabel,
      address_line: normalizedAddressLine
    })
    .eq("id", addressId)
    .eq("user_id", userId)
    .select("id,label,address_line,latitude,longitude")
    .single();

  if (error) {
    return {
      message: `Address was not updated: ${error.message}`,
      ok: false
    };
  }

  return {
    address: mapAddressRow(data as AddressRow),
    message: "Address updated in Supabase.",
    ok: true
  };
}

export async function deleteSavedAddress(addressId: string): Promise<{ message: string; ok: boolean }> {
  if (!supabase) {
    return { message: "Address removed locally.", ok: true };
  }

  const userResult = await supabase.auth.getUser();
  const userId = userResult.data.user?.id;

  if (!userId) {
    return { message: "Address removed locally. Sign in with Google to sync changes.", ok: true };
  }

  const { error } = await supabase
    .from("addresses")
    .delete()
    .eq("id", addressId)
    .eq("user_id", userId);

  if (error) {
    return { message: `Address was not deleted: ${error.message}`, ok: false };
  }

  return { message: "Address deleted from Supabase.", ok: true };
}

function buildLocalAddress(label: string, addressLine: string): SavedAddress {
  return {
    id: `address-${Date.now()}`,
    label,
    detail: addressLine,
    area: `Around ${addressLine}`,
    distanceBiasKm: 0.6
  };
}

function mapAddressRow(row: AddressRow): SavedAddress {
  return {
    id: row.id,
    label: row.label,
    detail: row.address_line,
    area: `Around ${row.address_line}`,
    distanceBiasKm: row.latitude && row.longitude ? 0 : 0.6
  };
}
