import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import type { Database } from "@/lib/supabase/database.types";
import { getSupabasePublicEnv } from "@/lib/supabase/env";

/**
 * Supabase client for Server Components, Server Actions and Route Handlers.
 *
 * Acts as the signed-in user (from the auth cookies) with the anon key, so RLS
 * applies to every query. Create one per request; never share across requests.
 *
 * Reading cookies makes the caller dynamic: with Cache Components, render the
 * component that uses this client inside a <Suspense> boundary.
 *
 * There is deliberately no service-role client yet. When one is needed
 * (webhooks, admin workflows) it gets its own server-only module.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  const { url, anonKey } = getSupabasePublicEnv();

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Server Components cannot set cookies. Session refresh will be
          // handled by src/proxy.ts, added with the auth feature (Phase 3).
        }
      },
    },
  });
}
