import Constants from "expo-constants";

declare const process: {
  env?: Record<string, string | undefined>;
};

type ExpoExtra = {
  monnifyCheckoutInitUrl?: string;
  monnifyApiKey?: string;
  monnifyContractCode?: string;
  monnifyMode?: string;
};

const extra = (Constants.expoConfig?.extra ?? {}) as ExpoExtra;
const env = process.env ?? {};

export const monnifyMode =
  env.EXPO_PUBLIC_MONNIFY_MODE || extra.monnifyMode || "TEST";

export const monnifyApiKey =
  env.EXPO_PUBLIC_MONNIFY_API_KEY || extra.monnifyApiKey || "";

export const monnifyContractCode =
  env.EXPO_PUBLIC_MONNIFY_CONTRACT_CODE || extra.monnifyContractCode || "";

export const monnifyCheckoutInitUrl =
  env.EXPO_PUBLIC_MONNIFY_CHECKOUT_INIT_URL ||
  extra.monnifyCheckoutInitUrl ||
  "https://chowtrek-landing.vercel.app/api/monnify-init";

export const isMonnifyConfigured = Boolean(monnifyApiKey && monnifyContractCode);
