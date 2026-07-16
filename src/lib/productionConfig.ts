import Constants from "expo-constants";

declare const process: {
  env?: Record<string, string | undefined>;
};

type ExpoExtra = {
  flutterwavePaymentUrl?: string;
};

const extra = (Constants.expoConfig?.extra ?? {}) as ExpoExtra;
const env = process.env ?? {};

export const flutterwavePaymentUrl =
  env.EXPO_PUBLIC_FLUTTERWAVE_PAYMENT_URL || extra.flutterwavePaymentUrl || "";

export const isFlutterwaveConfigured = Boolean(flutterwavePaymentUrl);
