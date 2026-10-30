import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./database.types";
import { publicEnv } from "./env";

export function createBrowserSupabase() {
  const { url, publishableKey } = publicEnv();
  return createBrowserClient<Database>(url, publishableKey);
}
