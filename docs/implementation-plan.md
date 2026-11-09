# Implementation plan

The playbook (§9) and the project brief number the phases differently. This plan follows the
playbook's order, which is the source of truth, and maps the brief's phases onto it. Each phase is
one or more `feature/*` branches with their own PR into `Develop`.

| Playbook phase | Brief phase(s) | Work | Branch (proposed) | Gate |
| -------------- | -------------- | ---- | ----------------- | ---- |
| 0 | — | Repo inspection, branch setup, conventions | `feature/project-foundation` | Clean baseline ✅ |
| 1 | 1 | Next.js foundation, responsive shell, design system | `feature/project-foundation` | App runs/builds ✅ (this PR) |
| 2 | (2) | Supabase clients, typed env, migrations, RLS, storage, seed | `feature/supabase-foundation` (BL-002) | DB/security tests |
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

## Next milestone — BL-002 Supabase foundation (needs owner input first)

Prerequisites from the owner:

1. Create the Supabase dev/pilot project and put its URL and keys in `.env.local` / Replit Secrets.
2. Decide on the test tooling (see below).
3. Answer the open questions in [`database-migration-plan.md`](database-migration-plan.md).

## Decisions needed from the owner

| # | Decision | Recommendation |
| - | -------- | -------------- |
| 1 | Test framework | Vitest for unit tests, pgTAP via `supabase test db` for RLS (no npm dependency), Playwright for e2e |
| 2 | Integration branch name (`Develop` vs `develop`) | Rename one so the playbook and GitHub match |
| 3 | Category ↔ listing-kind rules | Proposed: textbooks and equipment physical only (copyright/nature); notes and exam prep either; digital resources digital only |
| 4 | Formatting | Add Prettier + Tailwind class sorting so agents produce consistent diffs |
| 5 | CI | A GitHub Actions workflow running `npm run check` on PRs into `Develop` |
| 6 | Phase order for moderation | Reporting/takedown before or with fulfilment (P0) |
| 7 | Dark mode | Defer; tokens are ready |
