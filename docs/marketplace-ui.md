# BL-003: Marketplace UI shell

## Scope

The owner approved a mock-data UI milestone built on the existing Next.js App Router and
BookLoop design system. This is not a live, multi-user marketplace.

| Route | Purpose |
| --- | --- |
| `/browse` | Text search, category and physical/digital filters |
| `/browse/[slug]` | Listing details, price, seller copy and save/unsave |
| `/saved` | Browser-local saved resources |
| `/sell` | Validated physical or digital demo submission |

Preloaded sellers and listings are fictional and labelled **Sample listing**. New submissions
are labelled **Local demo listing**. Cards use illustrative graphics, not photographs of real
products. There are no purchase, contact, upload or authentication flows.

## Data-access boundary

- `src/features/marketplace/types.ts`: listing/category types; money is integer paise.
- `data/sample-listings.ts`: fictional fixtures, never written to browser storage.
- `data/repository.ts`: listing lookup, submission and save/unsave persistence, plus cached
  external-store snapshots for hydration-safe React subscriptions.
- `schemas/listing.ts`: Zod validation for title, description, category/type compatibility,
  price precision/range, physical condition and optional digital format.
- `components/`: interactive UI; App Router files remain thin entry points.

Future Supabase integration should replace the repository boundary only after listings tables,
RLS and server-side authorization/validation are approved and implemented. Existing Supabase
clients, generated database types and migrations were not modified in this milestone.

## Local persistence

| Key | Contents |
| --- | --- |
| `bookloop.marketplace.listings.v1` | Locally submitted demo listings |
| `bookloop.marketplace.saved.v1` | Saved listing slugs |

Data belongs to the **current site origin and browser profile on one device**. It does not sync
between accounts, devices, private-browsing sessions or different preview/published URLs.
Clearing browser data removes it. No personal contact details or uploaded files are collected.
Storage errors produce visible feedback rather than reporting a successful save.

Submission validation is client-side because this phase has no server mutation. It is not a
substitute for server-side validation or RLS in a future database-backed implementation.

## Running and verification

The managed Replit workflow runs:

```sh
npm run dev -- --hostname 0.0.0.0 --port 5000
```

No Supabase credentials are needed for this UI. Development origins permit loopback screenshot
checks and the exact Replit development host; this allowlist does not affect production.

Quality gate:

```sh
npm run check
```

The ESLint configuration excludes `.local/` because it contains Replit-provided helper
templates rather than BookLoop application code.

Browser smoke checks (Node 22+ and Chromium on PATH, or set `CHROMIUM_BIN`):

```sh
# Keep the app workflow running in another process.
TEST_BASE_URL=http://127.0.0.1:5000 node scripts/test-marketplace-ui.mjs
# On Replit, the same test can exercise the public preview:
TEST_BASE_URL="https://$REPLIT_DEV_DOMAIN" node scripts/test-marketplace-ui.mjs
```

The script uses a fresh temporary Chromium profile and removes it afterward. It checks search,
combined filters, empty/reset states, detail navigation, save/unsave and reload persistence,
required/price validation, error-summary focus, physical/digital submissions and reload
persistence, tablet/mobile layout, mobile navigation, and browser errors. No dependency or
JavaScript testing framework was added.

Verified in this milestone: `npm run check`, the Chromium smoke checks, and desktop/mobile
preview screenshots. No database migrations or database policy tests were run because this
milestone makes no database changes.
