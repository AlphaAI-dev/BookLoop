import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "@/lib/supabase/database.types";
import { getSupabasePublicEnv } from "@/lib/supabase/env";

/**
 * Supabase client for Client Components (browser).
 *
 * Uses the public anon/publishable key, so every query is subject to RLS.
 * `createBrowserClient` reuses one instance per browser tab.
 */
export function createSupabaseBrowserClient() {
  const { url, anonKey } = getSupabasePublicEnv();
  return createBrowserClient<Database>(url, anonKey);
}
