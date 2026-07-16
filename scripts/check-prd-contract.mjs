import { readFileSync } from "node:fs";

const filesToScan = [
  "package.json",
  "App.tsx",
  "src/components/BottomNav.tsx",
  "src/types/domain.ts"
];

const bottomNavSource = readFileSync("src/components/BottomNav.tsx", "utf8");
const requiredTabs = ["Home", "Discover", "Community", "Orders", "Profile"];
const forbiddenLabels = ["Merchant", "Agent", "Admin"];

for (const label of requiredTabs) {
  if (!bottomNavSource.includes(`label: "${label}"`)) {
    throw new Error(`Missing fixed bottom navigation label: ${label}`);
  }
}

const navLabelCount = [...bottomNavSource.matchAll(/label: "/g)].length;
if (navLabelCount !== requiredTabs.length) {
  throw new Error(`Expected ${requiredTabs.length} bottom nav labels, found ${navLabelCount}`);
}

for (const label of forbiddenLabels) {
  if (bottomNavSource.includes(`label: "${label}"`)) {
    throw new Error(`${label} must not be added to the fixed bottom navigation`);
  }
}

const bannedPatterns = [
  /firebase/i,
  /stripe/i,
  /paystack/i,
  /@react-native-firebase/i,
  /redux/i,
  /mobx/i,
  /getx/i,
  /bloc/i
];

for (const file of filesToScan) {
  const contents = readFileSync(file, "utf8");
  for (const pattern of bannedPatterns) {
    if (pattern.test(contents)) {
      throw new Error(`Banned PRD pattern ${pattern} found in ${file}`);
    }
  }
}

console.log("PRD contract check passed.");
