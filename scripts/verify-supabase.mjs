#!/usr/bin/env node
/**
 * BookLoop — Supabase connection verification (read-only).
 *
 *   npm run supabase:verify
 *
 * Reads NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY from the
 * environment (and from .env.local when present). Uses ONLY the public key, so
 * every check runs under RLS exactly as a browser would. It never writes data
 * and never prints key values.
 *
 * Checks:
 *   1. Variables are present, well-formed, and the public key is not a
 *      service-role/secret key.
 *   2. Auth service health endpoint responds.
 *   3. Database is reachable and the BL-002 migrations are applied
 *      (the five canonical categories exist with the approved listing kinds).
 *   4. RLS is active: anonymous visitors cannot read user_roles.
 */

import { existsSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

if (existsSync(".env.local") && typeof process.loadEnvFile === "function") {
  process.loadEnvFile(".env.local");
}

const EXPECTED_CATEGORIES = {
  textbooks: ["physical"],
  notes: ["physical", "digital"],
  equipment: ["physical"],
  "exam-prep": ["physical", "digital"],
  "digital-resources": ["digital"],
};

let failures = 0;
const pass = (msg) => console.log(`  ✔ ${msg}`);
const fail = (msg) => {
  failures += 1;
  console.log(`  ✖ ${msg}`);
};

function isPrivilegedKey(key) {
  if (key.startsWith("sb_secret_")) return true;
  const parts = key.split(".");
  if (parts.length !== 3) return false;
  try {
    return JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8")).role === "service_role";
  } catch {
    return false;
  }
}

console.log("BookLoop · Supabase verification\n");

// 1. Environment ------------------------------------------------------------
const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

console.log("Environment");
let parsedUrl;
try {
  parsedUrl = url ? new URL(url) : undefined;
} catch {
  parsedUrl = undefined;
}
if (!parsedUrl || !/^https?:$/.test(parsedUrl.protocol)) {
  fail("NEXT_PUBLIC_SUPABASE_URL is missing or not a valid http(s) URL");
} else {
  pass(`NEXT_PUBLIC_SUPABASE_URL set (host: ${parsedUrl.host})`);
}
if (!anonKey || anonKey.length < 20) {
  fail("NEXT_PUBLIC_SUPABASE_ANON_KEY is missing or too short");
} else if (isPrivilegedKey(anonKey)) {
  fail("NEXT_PUBLIC_SUPABASE_ANON_KEY is a service-role/secret key — replace it with the anon/publishable key");
} else {
  pass("NEXT_PUBLIC_SUPABASE_ANON_KEY set (public key, value hidden)");
}

if (failures > 0) {
  console.log("\nResult: FAIL — fix the environment variables above (see .env.example).");
  process.exit(1);
}

const supabase = createClient(url, anonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// 2. Auth -------------------------------------------------------------------
console.log("\nAuth");
try {
  const res = await fetch(new URL("/auth/v1/health", parsedUrl), {
    headers: { apikey: anonKey },
    signal: AbortSignal.timeout(10_000),
  });
  if (res.ok) pass(`Auth health endpoint responded (${res.status})`);
  else fail(`Auth health endpoint returned HTTP ${res.status}`);
} catch (error) {
  fail(`Auth health endpoint unreachable: ${error instanceof Error ? error.message : String(error)}`);
}

// 3. Database + migrations ----------------------------------------------------
console.log("\nDatabase");
const { data: categories, error: categoriesError } = await supabase
  .from("categories")
  .select("slug, allowed_listing_kinds")
  .order("sort_order");

if (categoriesError) {
  const missing = ["PGRST205", "42P01"].includes(categoriesError.code ?? "");
  fail(
    missing
      ? "categories table not found — migrations have not been applied to this project yet"
      : `query failed: ${categoriesError.code ?? ""} ${categoriesError.message}`,
  );
} else {
  pass(`Database reachable (${categories.length} active categories readable as anon)`);
  const bySlug = Object.fromEntries(categories.map((c) => [c.slug, [...c.allowed_listing_kinds].sort()]));
  const problems = Object.entries(EXPECTED_CATEGORIES).filter(
    ([slug, kinds]) => JSON.stringify(bySlug[slug]) !== JSON.stringify([...kinds].sort()),
  );
  if (problems.length === 0) pass("BL-002 categories and permitted listing kinds match");
  else fail(`unexpected/missing categories: ${problems.map(([slug]) => slug).join(", ")}`);
}

// 4. RLS sanity -----------------------------------------------------------------
console.log("\nRow Level Security");
const { data: roles, error: rolesError } = await supabase.from("user_roles").select("user_id").limit(1);
if (rolesError && (rolesError.code === "42501" || /permission denied/i.test(rolesError.message))) {
  pass("anonymous visitors cannot read user_roles");
} else if (rolesError) {
  fail(`unexpected error reading user_roles: ${rolesError.code ?? ""} ${rolesError.message}`);
} else {
  fail(`anonymous read of user_roles was allowed (${roles.length} rows) — check grants/RLS`);
}

console.log(failures === 0 ? "\nResult: PASS" : `\nResult: FAIL (${failures} check(s) failed)`);
process.exit(failures === 0 ? 0 : 1);
