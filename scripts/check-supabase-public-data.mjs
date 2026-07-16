import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const env = readEnvFile(".env.local");
const supabaseUrl = env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(".env.local must set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.");
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);
const expectedTables = [
  "merchant_profiles",
  "products",
  "vendor_timeline_events",
  "community_posts",
  "comments",
  "app_settings"
];

let hasError = false;

for (const table of expectedTables) {
  const { count, error } = await supabase.from(table).select("*", {
    count: "exact",
    head: true
  });

  if (error) {
    hasError = true;
    console.error(`${table}: ERROR ${error.message}`);
  } else {
    console.log(`${table}: OK count=${count ?? 0}`);
  }
}

if (hasError) {
  process.exit(1);
}

function readEnvFile(path) {
  return Object.fromEntries(
    readFileSync(path, "utf8")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#"))
      .map((line) => {
        const index = line.indexOf("=");
        return [line.slice(0, index), line.slice(index + 1)];
      })
  );
}
