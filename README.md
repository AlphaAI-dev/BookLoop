# BookLoop

BookLoop is a marketplace concept for students and creators. The idea is to make it easier to
discover and sell academic resources, including:

- Used textbooks
- Student notes and study guides
- Academic equipment
- Exam preparation resources
- Original educational content and tutorials

Listings are either **physical** (condition, photos, pickup/shipping) or **digital** (private,
access-controlled files the seller has the right to distribute).

> **Status:** BL-003 marketplace UI shell, built on the BL-001 app and BL-002 Supabase foundations.
> Browsing, details, saved items and listing submission use sample data and browser-local storage.
> Authentication, shared marketplace data, payments and fulfilment remain future work. See
> [`docs/implementation-plan.md`](docs/implementation-plan.md).

## Tech stack

| Area            | Choice                                                           |
| --------------- | ---------------------------------------------------------------- |
| Framework       | Next.js 16 (App Router, Cache Components, Turbopack)             |
| Language        | TypeScript (strict)                                              |
| Styling         | Tailwind CSS v4, shadcn/ui (Radix primitives), lucide-react      |
| Database / Auth | Supabase PostgreSQL + Supabase Auth (`@supabase/ssr`)            |
| File storage    | Supabase Storage; private bucket for paid files                  |
| Payments        | Razorpay, **test mode only** _(Phase 7)_                         |
| Validation      | Zod                                                              |
| Deployment      | Replit                                                           |

Locked decisions and team rules are in [`BOOKLOOP_TEAM_PLAYBOOK.md`](BOOKLOOP_TEAM_PLAYBOOK.md).

## Prerequisites

- Node.js **24 recommended**, matching Replit and CI (package minimum: 20.9)
- npm (the repository uses `package-lock.json`; do not mix package managers)
- Docker, only if you want to run the local Supabase stack (migrations and policy tests)

## Getting started

```bash
npm ci
npm run dev
```

Open <http://localhost:3000>.

Pages that don't touch Supabase run without `.env.local`. Anything that creates a Supabase client
needs `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (see below).
For Supabase development, copy `.env.example` to the ignored `.env.local` and replace only the
values needed for that work. Leave the tracked template as placeholders.

### Marketplace preview (BL-003)

- `/browse`: search and filter the fictional sample listings and your local demo listings.
- `/browse/[slug]`: resource details and save/unsave interactions.
- `/saved`: saved resources in this browser.
- `/sell`: validated physical or digital demo submission; no file is uploaded.

Saved items and newly submitted demo listings use **localStorage in the current browser profile
and site origin only**. They are not synced, backed up, or visible to other people; clearing
browser data removes them. Preloaded listings are labelled **Sample listing**, and submissions
are labelled **Local demo listing**. No marketplace operation currently calls Supabase.

See [`docs/marketplace-ui.md`](docs/marketplace-ui.md) for the data boundary, limitations and the
dependency-free Chromium smoke test.

### Supabase

Point the app at the dev project or at the local stack, then verify the connection:

```bash
npm run supabase:verify   # read-only: env, Auth health, migrations applied, RLS active
```

To work on the database locally (Docker required):

```bash
npm run db:start   # local stack with migrations + local-only demo seed
npm run db:test    # pgTAP policy tests
```

Migrations are applied to the shared remote project only by the database owner after review.
See [`docs/database-migration-plan.md`](docs/database-migration-plan.md) for the schema, RLS and
storage policies and the full workflow.

### On Replit

1. Import this GitHub repository into Replit and check out the agreed branch.
2. Run `npm ci` to install the versions recorded in `package-lock.json`.
3. Use the Run button's managed workflow: `npm run dev -- --hostname 0.0.0.0 --port 5000`.
   Unlike the local default of port 3000, this uses the preview port configured in `.replit`.
   The marketplace UI needs no secrets. When working on Supabase, provide only the required
   variables from `.env.example` through Replit Secrets; never commit real values.
4. For deployment: build command `npm run build`, run command `npm run start`.
   `next start` reads the `PORT` environment variable that Replit provides.

## Scripts

| Command             | What it does                                                    |
| ------------------- | --------------------------------------------------------------- |
| `npm run dev`       | Start the development server (Turbopack)                        |
| `npm run build`     | Production build                                                |
| `npm run start`     | Serve the production build                                      |
| `npm run lint`      | ESLint (`eslint-config-next`: core-web-vitals + TypeScript)     |
| `npm run typecheck` | Generate Next.js route types, then `tsc --noEmit`               |
| `npm run check`     | lint + typecheck + build (run before every PR)                  |
| `npm run db:start` / `db:stop` | Start/stop the local Supabase stack (Docker)          |
| `npm run db:reset`  | Rebuild the local DB from migrations + seed                     |
| `npm run db:test`   | pgTAP database policy tests (`supabase test db`)                |
| `npm run db:lint`   | Supabase schema linter                                          |
| `npm run db:types`  | Regenerate `src/lib/supabase/database.types.ts` from the local DB |
| `npm run supabase:verify` | Read-only connection check against the configured project |

Database policies are tested with pgTAP. A JavaScript unit-test runner has not been selected yet;
see the open decisions in [`docs/implementation-plan.md`](docs/implementation-plan.md).

## Project structure

```
src/
  app/                 Routes (App Router): pages, layouts, route handlers
  features/marketplace/ Marketplace UI, typed fixtures, local repository and validation
  components/
    ui/                shadcn/ui primitives (generated/vendored, keep unmodified where possible)
    layout/            App shell: header, footer, navigation
    shared/            Reusable composite components (page header, empty states)
  config/              Static, typed configuration (site metadata, navigation)
  lib/                 Framework-agnostic helpers (e.g. `cn`)
    supabase/          Browser client, public env validation, generated DB types
  server/
    db/                Server-only Supabase client (cookies, RLS as the signed-in user)
supabase/
  config.toml          Local stack configuration
  migrations/          Versioned SQL migrations (schema, RLS, storage)
  seed.sql             Local-only demo data
  tests/database/      pgTAP policy tests
scripts/               Connection verification and Chromium browser smoke checks
```

More directories are added as features land; see [`docs/architecture.md`](docs/architecture.md).

## Environment variables

See [`.env.example`](.env.example) for the names. Real values go in `.env.local` (git-ignored) and
Replit Secrets. Never commit secrets, and never give a secret a `NEXT_PUBLIC_` prefix.

## Contributing

- Work on a `feature/<name>`, `fix/<name>` or `chore/<name>` branch from the latest `Develop`.
- Open a pull request into `Develop`; the project owner reviews and merges.
- Run `npm run check` before opening a PR and report the actual results.
- Database changes only through versioned migrations in `supabase/migrations/`.

See [`CONTRIBUTING.md`](CONTRIBUTING.md) for the branch workflow, repository-hygiene rules and
review checklist. The checks-only [GitHub workflow](.github/workflows/check.yml) runs the same
`npm run check` on pull requests into `Develop`/`main` and pushes to `Develop`; it does not deploy.

## License

[MIT](LICENSE)
