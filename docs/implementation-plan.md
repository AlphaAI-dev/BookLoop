# Implementation plan

The playbook (§9) and the project brief number the phases differently. This plan follows the
playbook's order, which is the source of truth, and maps the brief's phases onto it. Each phase is
one or more `feature/*` branches with their own PR into `Develop`.

| Playbook phase | Brief phase(s) | Work | Branch (proposed) | Gate |
| -------------- | -------------- | ---- | ----------------- | ---- |
| 0 | — | Repo inspection, branch setup, conventions | `feature/project-foundation` | Clean baseline ✅ |
| 1 | 1 | Next.js foundation, responsive shell, design system | `feature/project-foundation` | App runs/builds ✅ (this PR) |
| 2 | (2) | Supabase clients, typed env, migrations, RLS, storage, seed | `feature/supabase-foundation` (BL-002) | DB/security tests ✅ (this PR) |
| 3 | 2 | Auth (signup, verification, login, logout) and profiles | `feature/supabase-auth` | Auth tests |
| 4 | 3, 5 | Categories, search and filters, listing detail | `feature/marketplace-search` (after BL-003 shell) | Search/detail tests |
| 5 | 4 | Physical and digital listing workflows, uploads | `feature/listings` | Listing/upload tests |
| 6 | — | Buyer and seller dashboards | `feature/dashboard` | Role/ownership tests |
| 7 | 6, 7, 8 | Cart, orders, Razorpay test checkout, signature + webhook verification | `feature/payments` | Payment test suite |
| 8 | 9 | Digital entitlements and signed downloads; physical fulfilment status | `feature/fulfilment` | Fulfilment tests |
| 9 | 10 | AI metadata suggestions (seller-confirmed), semantic search | `feature/ai` | Evaluation + human review |
| 10 | 11, 12 | Admin moderation and takedown, integration QA, Replit deployment | `feature/moderation`, `chore/release` | Release checklist |

Note: the brief puts admin moderation (11) after AI (10). Reporting is P0 in the playbook, so
reporting and takedown should land no later than phase 8. The owner should confirm this order.

## First milestone — "Foundation ready" (BL-001, this PR)

Done:

- Next.js 16 App Router + strict TypeScript + Tailwind v4 + ESLint, npm.
- shadcn/ui configured (`components.json`); primitives: Button, Badge, Card, Input, Label,
  Separator, Sheet, Skeleton.
- BookLoop design tokens and a responsive app shell: sticky header, desktop nav, mobile
  slide-over nav, footer, skip link.
- Home page, placeholder `/browse` and `/sell` routes (so nav has no dead links), branded 404 and
  error boundary, SVG app icon.
- `.env.example` (placeholders only), `.gitignore` re-checked (`.env*` ignored, template allowed).
- `README.md`, `CLAUDE.md`, the playbook committed to the repo, and these planning docs.
- Scripts: `lint`, `typecheck`, `build`, `check`.

Exit criteria: `npm run dev` serves the app; `lint`, `typecheck` and `build` pass; owner reviews
the PR into `Develop`.

## Milestone 2 — "Supabase foundation" (BL-002, this PR)

Done:

- Supabase CLI config (`supabase/config.toml`) and npm `db:*` scripts.
- Typed browser and server clients (`@supabase/ssr`), Zod-validated public env that refuses
  service-role keys, and generated `Database` types.
- Migrations 1–4: helpers/enums, profiles + admin role model, categories with permitted listing
  kinds, and storage buckets + policies. RLS and narrowed grants on every table.
- Local-only seed (demo student, creator and admin).
- pgTAP suite: 64 assertions, checked by mutation.
- `npm run supabase:verify` connection check.
- Database documentation rewritten; the playbook's branch name standardised to `Develop`.

Owner actions after merge:

1. Add `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` to `.env.local` and Replit
   Secrets.
2. The designated database owner applies migrations to the dev project (`supabase db push`),
   sets the hosted Auth settings, then runs `npm run supabase:verify`.
3. Grant the first admin with SQL (see the database doc).

## Next milestone — Phase 3: auth and profiles (`feature/supabase-auth`)

Signup with email verification, login and logout, `src/proxy.ts` session refresh, and profile
editing (Zod-validated server actions, avatar upload into the owner's folder).

## Decisions needed from the owner

| # | Decision | Recommendation |
| - | -------- | -------------- |
| 1 | Test framework (JS) | Vitest for unit tests and Playwright for e2e. pgTAP is in place for the database since BL-002 |
| 2 | ~~Integration branch name~~ | Resolved in BL-002: `Develop` |
| 3 | ~~Category ↔ listing-kind rules~~ | Resolved in BL-002: approved mapping, stored in `categories.allowed_listing_kinds` |
| 4 | Formatting | Add Prettier + Tailwind class sorting so agents produce consistent diffs |
| 5 | CI | A GitHub Actions workflow running `npm run check` on PRs into `Develop` |
| 6 | Phase order for moderation | Reporting/takedown before or with fulfilment (P0) |
| 7 | Dark mode | Defer; tokens are ready |
