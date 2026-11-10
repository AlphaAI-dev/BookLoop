import { z } from "zod";

/**
 * Public Supabase configuration, validated with Zod.
 *
 * Only NEXT_PUBLIC_* values are read here, so this module is safe to import
 * from client and server code. `process.env.NEXT_PUBLIC_*` must be referenced
 * literally for Next.js to inline the values into the browser bundle.
 *
 * Error messages name the variables but never print their values.
 */

const publicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url({ protocol: /^https?$/ }),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().trim().min(20),
});

export type SupabasePublicEnv = {
  url: string;
  anonKey: string;
};

/**
 * True when a key grants service-role access: a new-style `sb_secret_` key or
 * a legacy JWT whose `role` claim is `service_role`. Such keys bypass RLS and
 * must never be shipped to the browser.
 */
export function isPrivilegedSupabaseKey(key: string): boolean {
  if (key.startsWith("sb_secret_")) return true;

  const parts = key.split(".");
  if (parts.length !== 3) return false;

  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const payload: unknown = JSON.parse(atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "=")));
    return (
      typeof payload === "object" &&
      payload !== null &&
      "role" in payload &&
      payload.role === "service_role"
    );
  } catch {
    return false;
  }
}

export function getSupabasePublicEnv(): SupabasePublicEnv {
  const result = publicEnvSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });

  if (!result.success) {
    const names = [...new Set(result.error.issues.map((issue) => String(issue.path[0])))];
    throw new Error(
      `Supabase is not configured: missing or invalid ${names.join(", ")}. ` +
        "Copy .env.example to .env.local (or add them to Replit Secrets).",
    );
  }

  const { NEXT_PUBLIC_SUPABASE_URL: url, NEXT_PUBLIC_SUPABASE_ANON_KEY: anonKey } = result.data;

  if (isPrivilegedSupabaseKey(anonKey)) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY contains a service-role/secret key. " +
        "Use the anon (publishable) key; the service-role key must stay server-only.",
    );
  }

  return { url, anonKey };
}
