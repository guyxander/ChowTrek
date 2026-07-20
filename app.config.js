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
    monnifyCheckoutInitUrl:
      env.EXPO_PUBLIC_MONNIFY_CHECKOUT_INIT_URL ||
      baseConfig.expo.extra?.monnifyCheckoutInitUrl,
    monnifyApiKey:
      env.EXPO_PUBLIC_MONNIFY_API_KEY || baseConfig.expo.extra?.monnifyApiKey,
    monnifyContractCode:
      env.EXPO_PUBLIC_MONNIFY_CONTRACT_CODE || baseConfig.expo.extra?.monnifyContractCode,
    monnifyMode:
      env.EXPO_PUBLIC_MONNIFY_MODE || baseConfig.expo.extra?.monnifyMode || "TEST"
  }
});
