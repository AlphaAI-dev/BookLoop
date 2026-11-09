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

> **Status:** Phase 1 (project foundation and design system). Marketplace, auth, payments and
> fulfilment are built in later phases. See [`docs/implementation-plan.md`](docs/implementation-plan.md).

## Tech stack

| Area            | Choice                                                           |
| --------------- | ---------------------------------------------------------------- |
| Framework       | Next.js 16 (App Router, Cache Components, Turbopack)             |
| Language        | TypeScript (strict)                                              |
| Styling         | Tailwind CSS v4, shadcn/ui (Radix primitives), lucide-react      |
| Database / Auth | Supabase PostgreSQL + Supabase Auth _(from BL-002)_              |
| File storage    | Supabase Storage; private bucket for paid files _(from BL-002)_  |
| Payments        | Razorpay, **test mode only** _(Phase 7)_                         |
| Validation      | Zod _(added with the first server input)_                        |
| Deployment      | Replit                                                           |

Locked decisions and team rules are in [`BOOKLOOP_TEAM_PLAYBOOK.md`](BOOKLOOP_TEAM_PLAYBOOK.md).

## Prerequisites

- Node.js **20.9 or later** (developed on Node 22)
- npm (the repository uses `package-lock.json`; do not mix package managers)

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in values when Supabase/Razorpay are set up
npm run dev
```

Open <http://localhost:3000>.

Phase 1 does not read any environment variables, so the app runs without `.env.local`.

### On Replit

1. Import this GitHub repository into Replit and check out the agreed branch.
2. Add the variable names from `.env.example` under **Secrets** (never in files).
3. Run `npm install`, then `npm run dev` for preview.
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

A test runner has not been selected yet; see the open decisions in
[`docs/implementation-plan.md`](docs/implementation-plan.md).

## Project structure

```
src/
  app/                 Routes (App Router): pages, layouts, route handlers
  components/
    ui/                shadcn/ui primitives (generated/vendored, keep unmodified where possible)
    layout/            App shell: header, footer, navigation
    shared/            Reusable composite components (page header, empty states)
  config/              Static, typed configuration (site metadata, navigation)
  lib/                 Framework-agnostic helpers (e.g. `cn`)
```

Directories added in later phases (`features/`, `server/`, `supabase/migrations/` …) are described
in [`docs/architecture.md`](docs/architecture.md).

## Environment variables

See [`.env.example`](.env.example) for the names. Real values go in `.env.local` (git-ignored) and
Replit Secrets. Never commit secrets, and never give a secret a `NEXT_PUBLIC_` prefix.

## Contributing

- Work on a `feature/<name>` or `fix/<name>` branch created from the latest `Develop`.
- Open a pull request into `Develop`; the project owner reviews and merges.
- Run `npm run check` before opening a PR and report the actual results.
- Database changes only through versioned migrations in `supabase/migrations/`.

## License

[MIT](LICENSE)
