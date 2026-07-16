import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const env = readEnvFile(".env.local");
const supabaseUrl = env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(".env.local must set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.");
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);
const expectedMinimums = {
  merchant_profiles: 3,
  products: 5,
  vendor_timeline_events: 3,
  community_posts: 2,
  comments: 1,
  app_settings: 1
};

let hasError = false;

for (const [table, minimum] of Object.entries(expectedMinimums)) {
  const { count, error } = await supabase.from(table).select("*", {
    count: "exact",
    head: true
  });

  if (error) {
    hasError = true;
    console.error(`${table}: ERROR ${error.message}`);
    continue;
  }

  const actual = count ?? 0;
  const status = actual >= minimum ? "OK" : "MISSING";
  console.log(`${table}: ${status} count=${actual} expected>=${minimum}`);

  if (actual < minimum) {
    hasError = true;
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
