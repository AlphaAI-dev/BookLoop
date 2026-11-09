# CLAUDE.md — BookLoop agent guide

Read [`BOOKLOOP_TEAM_PLAYBOOK.md`](BOOKLOOP_TEAM_PLAYBOOK.md) before any task. It is the source of
truth for scope, architecture, Git workflow, database and payment rules. If this file and the
playbook disagree, the playbook wins; ask the project owner when in doubt.

@AGENTS.md

## Commands

```bash
npm run dev         # dev server
npm run lint        # ESLint
npm run typecheck   # next typegen && tsc --noEmit
npm run build       # production build
npm run check       # all three above — must pass before a PR
```

Never report a command as passing unless it ran and passed in this session.

## Next.js 16 notes (differs from older training data)

- `cacheComponents` and `partialPrefetching` are enabled: data fetching is dynamic by default;
  opt in to caching with `"use cache"`. No `runtime` segment exports.
- `middleware.ts` is now `proxy.ts`.
- `error.tsx` receives `retry()` (prefer it over `reset()`); `error` is typed `unknown`.
- Client hooks that read URL data (`usePathname`, `useSearchParams`, `useParams`) may need a
  `<Suspense>` boundary under dynamic routes, or the build fails.
- Tailwind v4 runs through the `@tailwindcss/turbopack` loader in `next.config.ts`
  (there is no `postcss.config` / `tailwind.config`). Tokens live in `src/app/globals.css`.
- Check `node_modules/next/dist/docs/` before using an unfamiliar API.

## Architecture conventions

See [`docs/architecture.md`](docs/architecture.md). In short:

- `src/app` — routing only: pages, layouts, route handlers, server actions that call services.
- `src/features/<domain>` — domain UI + client logic (listings, orders, …).
- `src/server/<domain>` — server-only services and data access (`import "server-only"`).
- `src/lib` — framework-agnostic helpers; `src/config` — static typed config.
- `src/components/ui` — shadcn/ui primitives; `layout/` — app shell; `shared/` — composites.
- Import with the `@/` alias. Server Components by default; add `"use client"` only when needed.

## Non-negotiables

- Strict TypeScript; validate every external input with Zod on the server.
- Authorize every protected operation on the server and with RLS. Hiding UI is not authorization.
- Money is integer paise. The server computes all prices and totals.
- Never mark an order paid from a browser callback. Verify signatures (checkout + webhook raw
  body) and payment status server-side; process webhooks idempotently.
- Paid digital files live in a private bucket; downloads use short-lived signed URLs after an
  entitlement check, and are audited.
- No secrets in code, commits, logs or `NEXT_PUBLIC_` variables.
- Schema/RLS/storage changes only via `supabase/migrations/`; never apply them to the shared remote.
- No new dependency, database, ORM, payment provider, UI framework or AI provider without
  owner approval — propose options first.

## shadcn/ui

`components.json` is configured (new-york style, Radix, lucide, neutral base, CSS variables).
Add components with `npx shadcn@latest add <name>` where the registry is reachable. If it is
not, vendor the standard component source by hand and say so in the PR.

## Git

Branch from the latest `Develop` as `feature/<name>` / `fix/<name>` / `chore/<name>`; open the PR
into `Develop`. Never push to `main`, never merge your own PR, never work on another agent's
active branch. Stop and report if the working tree contains unexpected changes.
