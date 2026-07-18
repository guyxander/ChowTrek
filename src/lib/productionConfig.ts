import Constants from "expo-constants";

declare const process: {
  env?: Record<string, string | undefined>;
};

type ExpoExtra = {
  quicktellerCheckoutBridgeUrl?: string;
  quicktellerCurrencyCode?: string;
  quicktellerMerchantCode?: string;
  quicktellerMode?: string;
  quicktellerPayItemId?: string;
};

const extra = (Constants.expoConfig?.extra ?? {}) as ExpoExtra;
const env = process.env ?? {};

export const quicktellerMode =
  env.EXPO_PUBLIC_QUICKTELLER_MODE || extra.quicktellerMode || "TEST";

export const quicktellerMerchantCode =
  env.EXPO_PUBLIC_QUICKTELLER_MERCHANT_CODE || extra.quicktellerMerchantCode || "";

export const quicktellerPayItemId =
  env.EXPO_PUBLIC_QUICKTELLER_PAY_ITEM_ID || extra.quicktellerPayItemId || "";

export const quicktellerCurrencyCode =
  env.EXPO_PUBLIC_QUICKTELLER_CURRENCY_CODE || extra.quicktellerCurrencyCode || "566";

export const quicktellerCheckoutBridgeUrl =
  env.EXPO_PUBLIC_QUICKTELLER_CHECKOUT_BRIDGE_URL ||
  extra.quicktellerCheckoutBridgeUrl ||
  "https://chowtrek-landing.vercel.app/quickteller-checkout/";

export const isQuicktellerConfigured = Boolean(quicktellerMerchantCode && quicktellerPayItemId);
