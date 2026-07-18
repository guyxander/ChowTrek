const fs = require("fs");
const path = require("path");

const baseConfig = require("./app.json");

function readLocalEnv() {
  const envPath = path.join(__dirname, ".env.local");

  if (!fs.existsSync(envPath)) {
    return {};
  }

  return fs
    .readFileSync(envPath, "utf8")
    .split(/\r?\n/)
    .reduce((values, line) => {
      const trimmed = line.trim();

      if (!trimmed || trimmed.startsWith("#")) {
        return values;
      }

      const separatorIndex = trimmed.indexOf("=");

      if (separatorIndex === -1) {
        return values;
      }

      const key = trimmed.slice(0, separatorIndex).trim();
      const value = trimmed.slice(separatorIndex + 1).trim().replace(/^['"]|['"]$/g, "");

      values[key] = value;
      return values;
    }, {});
}

const localEnv = readLocalEnv();
const env = { ...localEnv, ...process.env };

module.exports = () => ({
  ...baseConfig.expo,
  extra: {
    ...baseConfig.expo.extra,
    quicktellerCheckoutBridgeUrl:
      env.EXPO_PUBLIC_QUICKTELLER_CHECKOUT_BRIDGE_URL ||
      baseConfig.expo.extra?.quicktellerCheckoutBridgeUrl,
    quicktellerCurrencyCode:
      env.EXPO_PUBLIC_QUICKTELLER_CURRENCY_CODE || baseConfig.expo.extra?.quicktellerCurrencyCode,
    quicktellerMerchantCode:
      env.EXPO_PUBLIC_QUICKTELLER_MERCHANT_CODE || baseConfig.expo.extra?.quicktellerMerchantCode,
    quicktellerMode:
      env.EXPO_PUBLIC_QUICKTELLER_MODE || baseConfig.expo.extra?.quicktellerMode || "TEST",
    quicktellerPayItemId:
      env.EXPO_PUBLIC_QUICKTELLER_PAY_ITEM_ID || baseConfig.expo.extra?.quicktellerPayItemId
  }
});
