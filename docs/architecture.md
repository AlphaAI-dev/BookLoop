# BookLoop architecture

Status: proposed with BL-001 (Phase 1), updated in BL-002 (Supabase foundation). Changes need
project-owner approval (playbook §1, §3).

## 1. Repository assessment (at BL-001 start)

| Item               | Finding                                                                 |
| ------------------ | ----------------------------------------------------------------------- |
| Commits            | One (`Initial commit`): `README.md` (concept text) and `LICENSE` (MIT)  |
| Branches (remote)  | `main`, `Develop`, `feature/project-foundation`, all at the initial commit |
| Existing app       | None; no package manager, no framework, no landing page                 |
| Package manager    | None detected, so **npm** was chosen (matches the playbook commands)    |
| Secrets            | None present                                                            |
| CI                 | None                                                                     |
| Agent docs         | `BOOKLOOP_TEAM_PLAYBOOK.md` and `CLAUDE.md` were not yet in the repo; added in BL-001 |

Note: the integration branch is **`Develop`** (capital D). BL-002 changed the playbook to
match.

## 2. Layered architecture

```
Browser ──► src/app (routes, layouts, server actions, route handlers)
                │  validates input (Zod), resolves the session, calls services
                ▼
            src/server/<domain>  (server-only services: business rules, authorization)
                │
                ▼
            Supabase (Postgres + RLS, Auth, Storage)   Razorpay API / webhooks
```

| Layer          | Location                     | Rules                                                                 |
| -------------- | ---------------------------- | --------------------------------------------------------------------- |
| UI             | `src/components`, `src/features/<domain>/components` | Presentational. No secrets, no direct privileged DB access. |
| Routing / API  | `src/app/**` (`page.tsx`, `route.ts`, server actions) | Thin. Parse input with Zod, check auth, delegate to a service. |
| Service        | `src/server/<domain>/*.ts`   | `import "server-only"`. Owns business rules (pricing, entitlement, order state). Pure functions where possible, so they can be unit-tested. |
| Data access    | `src/server/db/*`, Supabase clients | User-scoped client (RLS applies) by default; service-role client only in narrowly scoped server modules (webhooks, admin), never imported by client code. |
| Database       | `supabase/migrations/*.sql`  | Schema, constraints, RLS, storage policies, triggers. The last line of defence. |

Defence in depth: every protected operation is checked in the service layer **and** by RLS.

## 3. Folder conventions

Present after BL-002:

```
src/app/                 App Router routes
src/components/ui/       shadcn/ui primitives
src/components/layout/   Header, footer, navigation
src/components/shared/   Reusable composites (PageHeader, ComingSoon)
src/config/              Static typed config (site, nav, temporary category copy)
src/lib/                 Framework-agnostic helpers
src/lib/supabase/        Browser client, Zod-validated public env, generated Database types
src/server/db/           Server-only Supabase client (cookie session, anon key, RLS applies)
supabase/config.toml     Local stack configuration
supabase/migrations/     Versioned SQL migrations (schema, RLS, storage buckets/policies)
supabase/seed.sql        Local/demo seed data only
supabase/tests/database/ pgTAP policy tests (`npm run db:test`)
scripts/                 Operational scripts (verify-supabase.mjs)
```

Added by later phases (create them when first needed, not before):

```
src/features/<domain>/   Domain UI, hooks, client-side schemas (listings, orders, profile …)
src/server/<domain>/     Server-only services (pricing, orders, payments, entitlements …)
src/server/db/admin.ts   Service-role client for webhooks/admin workflows (needs review)
src/server/env.ts        Server-only env validation (service role, Razorpay secrets)
src/lib/validation/      Shared Zod schemas used on both sides (server is authoritative)
src/proxy.ts             Supabase session refresh (Next 16 "proxy" = former middleware), with auth
tests/ or *.test.ts      Unit/integration tests, pending framework approval
e2e/                     Playwright journeys, pending approval
```

The generated `Database` types live in `src/lib/supabase/` (not `src/server/`) because the browser
client needs them too.

Naming: kebab-case files, PascalCase components, named exports (except Next.js special files).

## 4. Design system

- Tokens are CSS variables in `src/app/globals.css`, using shadcn/ui names plus BookLoop
  additions: `highlight`, `success`, `warning`, `info` (for listing badges and order/fulfilment status).
- Brand: deep "ink" blue as primary, warm amber `highlight` used sparingly; Geist Sans/Mono via
  `next/font` (self-hosted at build time).
- `page-container` utility gives the shared responsive gutter (16 / 24 / 32 px, max 80rem).
- Dark-mode tokens exist under `.dark`, but no theme toggle ships yet (it would need a dependency
  such as `next-themes`, which needs approval).
- Accessibility baseline: skip link, visible focus rings, labelled navigation landmarks, a
  Radix Dialog-based mobile menu (focus trap, Escape to close), and smooth scrolling that
  respects reduced-motion settings.

## 5. Dependencies

### Installed in BL-001

| Package | Kind | Why |
| ------- | ---- | --- |
| `next` 16.4.6, `react` / `react-dom` 19.3 | runtime | Locked framework |
| `tailwindcss` 4.3, `@tailwindcss/turbopack` | dev | Locked styling (Next 16 scaffold default) |
| `radix-ui`, `class-variance-authority`, `clsx`, `tailwind-merge`, `lucide-react` | runtime | shadcn/ui component dependencies |
| `tw-animate-css` | dev | shadcn/ui animation utilities (Sheet open/close) |
| `typescript` 5, `@types/*` | dev | Strict TypeScript |
| `eslint` 9, `eslint-config-next` | dev | Linting |

### Installed in BL-002

| Package | Kind | Why |
| ------- | ---- | --- |
| `@supabase/supabase-js` 2.118, `@supabase/ssr` 0.12 | runtime | Locked: Supabase DB/Auth/Storage clients with cookie sessions for the App Router |
| `zod` 4.6 | runtime | Locked: validation (env now; inputs from Phase 3) |
| `supabase` 2.122.0 (CLI, exact pin) | dev | Migrations, local stack, pgTAP runner, type generation |

`server-only` is handled natively by Next.js (`import "server-only"` needs no package). pgTAP
runs inside the local Supabase Postgres, so it adds no npm dependency.

`npm audit` reports 8 moderate advisories, all in the ESLint/typescript-eslint dev toolchain pulled
in by `eslint-config-next`. They don't ship to production. The only fix npm offers is
`--force` (a breaking downgrade), so the advisories are left in place until upstream releases a fix.

### Planned (each added in its phase, listed in that phase's PR)

| Package | Phase | Purpose | Status |
| ------- | ----- | ------- | ------ |
| `vitest` (dev) | 3 | Unit tests for business logic (pricing, state machines, signatures) | **Needs approval** |
| `@playwright/test` (dev) | 4+ | End-to-end journeys and responsive checks | **Needs approval** |
| `react-hook-form`, `@hookform/resolvers` | 5 | Listing forms with Zod schemas | **Needs approval** (optional) |
| `razorpay` (Node SDK) | 7 | Server-side order creation. Signature checks use `node:crypto` HMAC | Candidate; **needs approval** |
| `next-themes` | any | Dark-mode toggle | Optional, **needs approval** |
| `prettier`, `prettier-plugin-tailwindcss` (dev) | any | Formatting consistency between agents | Recommended, **needs approval** |
| `pgvector` (Postgres extension) | 9 | Semantic search inside Supabase | **Needs approval**, AI provider TBD |
