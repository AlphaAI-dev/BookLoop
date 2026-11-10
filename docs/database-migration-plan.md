# Database and migrations

Status: **BL-002 implemented** (Supabase foundation, migrations 1–4). Later batches remain a
proposal and need owner review before implementation.

Migrations are tested locally (`npm run db:reset` + `npm run db:test`) and applied to the shared
remote project **only by the designated database owner, after the PR is merged and approved**
(playbook §6). None of the BL-002 migrations have been applied to the remote dev project by an agent.

## Conventions

- One coherent change per migration, created with `npx supabase migration new <verb_noun>`.
  **Never edit a migration that has been merged.** Change things with a new migration.
- `uuid` primary keys (`gen_random_uuid()`). `created_at` / `updated_at timestamptz`, with
  `updated_at` maintained by the `private.set_updated_at()` trigger.
- Money (future): `bigint` **paise** with `check (amount >= 0)`, `currency text default 'INR'`.
- Status/kind columns use Postgres enums.
- RLS is enabled on **every** table in `public`, in the same migration that creates it. A pgTAP
  guard test fails if any table lacks RLS.
- Supabase grants API roles `ALL` on new tables by default, so every migration **narrows table
  privileges explicitly** (`revoke all … from anon, authenticated`, then grant only what is needed,
  column-scoped where relevant). Policies and grants are two independent layers.
- Internal functions live in the unexposed `private` schema. `security definer` functions always
  use `set search_path = ''` and fully qualified names, and `execute` is revoked from `public`.
- Reference data needed in every environment (categories) is inserted **by migrations**. Demo
  data lives in `supabase/seed.sql` and runs **locally only**.
- Files are never stored in the database, only Storage object paths.

## Implemented in BL-002

| # | File | Contents |
| - | ---- | -------- |
| 1 | `20261109120000_create_helpers.sql` | `private` schema; enums `listing_kind` (`physical`, `digital`), `app_role` (`admin`), `seller_type` (`student`, `educator`, `creator`); `private.set_updated_at()` |
| 2 | `20261109120100_create_profiles_and_roles.sql` | `profiles`, signup trigger `on_auth_user_created` → `private.handle_new_user()`, `user_roles`, `private.is_admin()` |
| 3 | `20261109120200_create_categories.sql` | `categories` plus the five canonical categories and their permitted listing kinds |
| 4 | `20261109120300_create_storage_buckets.sql` | Buckets `avatars`, `listing-images`, `digital-resources` and `storage.objects` policies |

### Tables and relationships

```
auth.users 1 ──── 1 public.profiles        (profiles.id → auth.users.id, on delete cascade)
auth.users 1 ──── * public.user_roles      (user_roles.user_id → auth.users.id, on delete cascade)
auth.users 1 ──── * public.user_roles      (user_roles.granted_by → auth.users.id, on delete set null)
public.categories                          (standalone reference data; listings will reference it)
```

**`profiles`**: one row per auth user, created automatically on signup. Public-safe fields only.
No phone, address or other private contact data (playbook: minimise personal data).

| Column | Type | Rules |
| ------ | ---- | ----- |
| `id` | uuid PK | = `auth.users.id` |
| `username` | text, unique, nullable | `^[a-z0-9_]{3,30}$`; chosen after signup |
| `display_name` | text | 1–80 chars after trim; from signup metadata `display_name` (trimmed and clamped) or `BookLoop member` |
| `avatar_path` | text, nullable | Must start with `<id>/` (an object in the owner's avatars folder), ≤ 512 chars |
| `bio` | text, nullable | ≤ 500 chars |
| `institution` | text, nullable | ≤ 120 chars |
| `seller_type` | `seller_type`, nullable | Self-declared persona; **grants no permissions** |
| `created_at`, `updated_at` | timestamptz | `updated_at` set by trigger |

**`user_roles`**: privileged roles only. Buyer/seller are capabilities of every account, not roles.

| Column | Type | Rules |
| ------ | ---- | ----- |
| `user_id` | uuid | FK `auth.users`, cascade; PK part |
| `role` | `app_role` | PK part; currently only `admin` |
| `granted_at` | timestamptz | default `now()` |
| `granted_by` | uuid, nullable | FK `auth.users`, set null; indexed |

**`categories`**

| Column | Type | Rules |
| ------ | ---- | ----- |
| `id` | uuid PK | |
| `slug` | text, unique | lowercase kebab-case |
| `name` | text | 1–80 chars |
| `description` | text | ≤ 300 chars |
| `allowed_listing_kinds` | `listing_kind[]` | 1–2 entries |
| `sort_order` | integer | |
| `is_active` | boolean | default `true` |

Canonical rows (approved):

| Slug | Name | Allowed listing kinds |
| ---- | ---- | --------------------- |
| `textbooks` | Used textbooks | physical |
| `notes` | Notes & study guides | physical, digital |
| `equipment` | Academic equipment | physical |
| `exam-prep` | Exam preparation | physical, digital |
| `digital-resources` | Digital resources | digital |

### Indexes

| Index | Purpose |
| ----- | ------- |
| `profiles_pkey`, `profiles_username_key` (unique) | Lookup by id / username; uniqueness |
| `user_roles_pkey (user_id, role)` | Role checks in `is_admin()` |
| `user_roles_granted_by_idx` | FK index (audit lookups, cascades) |
| `categories_pkey`, `categories_slug_key` (unique) | Lookup by id / slug |
| `categories_active_sort_idx (is_active, sort_order)` | Public category listing |

### Table privileges and RLS

| Table | anon | authenticated | Write path |
| ----- | ---- | ------------- | ---------- |
| `profiles` | `SELECT` all rows | `SELECT` all rows; `UPDATE` **only** `username, display_name, avatar_path, bio, institution, seller_type`, **only own row** (`auth.uid() = id` in `using` and `with check`) | Insert by signup trigger; delete by auth-user cascade |
| `user_roles` | no privileges | `SELECT` own rows only | **Service role / SQL as DB owner only.** No API role can insert, update or delete, so admin can never be self-assigned or granted by another admin through the API |
| `categories` | `SELECT` where `is_active` | `SELECT` where `is_active`; admins (`private.is_admin()`) also see inactive rows | Migrations, or a future trusted server-side admin workflow using the service role |

`private.is_admin()` is `security definer`, checks only the **caller's own** uid, and is executable
by `authenticated` (not `anon`).

### Storage buckets and policies

Path convention for every bucket: **`<owner auth uid>/<file>`**. The first folder must equal the
uploader's uid.

| Bucket | Public | Size limit | Allowed MIME types |
| ------ | ------ | ---------- | ------------------ |
| `avatars` | yes (public URL read) | 2 MB | JPEG, PNG, WebP |
| `listing-images` | yes (public URL read) | 5 MB | JPEG, PNG, WebP (no SVG) |
| `digital-resources` | **no** | 50 MB (the Free plan cap) | PDF, EPUB, DOCX, PPTX, XLSX |

Policies on `storage.objects`, identical for all three buckets and scoped by `bucket_id`:

- `authenticated` may `SELECT`, `INSERT`, `UPDATE`, `DELETE` only where
  `(storage.foldername(name))[1] = auth.uid()::text`.
- No `anon` policies. Public buckets are still readable through their public URLs, but objects
  can't be listed or written anonymously.
- **No buyer read policy on `digital-resources`.** In Phase 8 the server will issue short-lived
  signed URLs (service role) after checking a purchase entitlement, and record a download audit
  row. This bucket must never be made public.
- Bucket MIME and size limits are a first line of defence only. Upload server actions must still
  validate extension, content and ownership (playbook §8).

Note: `listing-images` objects are publicly readable by URL, including images of draft listings
(the paths are unguessable). This was approved for BL-002.

## Verification performed (local stack)

- `npm run db:reset`: all 4 migrations and the seed apply cleanly from scratch.
- `npm run db:test`: 64 pgTAP assertions in `supabase/tests/database/` (RLS-everywhere guard,
  privilege checks, bucket configuration, categories, and these playbook negative tests:
  anonymous protected action, user edits another user's profile, user assigns self admin, and
  unpaid/foreign access to a private file).
- The tests were checked by mutation: deliberately adding a table without RLS, a self-admin
  policy and a public read policy on `digital-resources` made the relevant tests fail.
- `npm run db:lint`: no schema errors.
- End-to-end checks through the real Auth, PostgREST and Storage APIs using the seeded demo users:
  cross-folder upload rejected, foreign download and signed-URL creation rejected, MIME and size
  limits enforced, self-admin via the API rejected.

## Workflow

### Local development (Docker required)

```bash
npm run db:start      # start the local Supabase stack (applies migrations + seed)
npm run db:reset      # rebuild the local DB from migrations + seed
npm run db:test       # pgTAP policy tests
npm run db:lint       # schema linter
npm run db:types      # regenerate src/lib/supabase/database.types.ts after schema changes
npm run db:stop
```

Point `.env.local` at the local stack (`http://127.0.0.1:54321` and the anon key printed by
`npx supabase status`) or at the dev project.

If Docker can't pull from `public.ecr.aws` on your network, set
`SUPABASE_INTERNAL_IMAGE_REGISTRY=docker.io` before running the CLI.

### Applying to the shared remote dev project (database owner only, after approval)

```bash
npx supabase login                               # uses SUPABASE_ACCESS_TOKEN or browser login
npx supabase link --project-ref <project-ref>    # prompts for the DB password (SUPABASE_DB_PASSWORD)
npx supabase migration list                      # confirm local and remote history agree
npx supabase db push --dry-run                   # review what will run
npx supabase db push                             # apply pending migrations
npm run supabase:verify                          # read-only check with the app's public key
```

Rules: one person applies migrations at a time. If `migration list` shows divergence, stop and
reconcile; never `migration repair` or reset remote data blindly. **Never run `seed.sql`
remotely.**

Hosted settings that migrations do not cover (set them in the dashboard):

- Auth → URL configuration: site URL and redirect URLs (local + Replit domains).
- Auth → Email: confirm email **on** (P0 requires email verification).
- API → Exposed schemas: keep `public` (and `graphql_public`) only. **Do not expose `private`.**

### Granting the first admin (database owner)

Admin can't be granted through the app. In the dashboard SQL editor:

```sql
insert into public.user_roles (user_id, role, granted_by)
values ('<user uuid>', 'admin', null);
```

## Proposed later batches (not implemented)

| # | Migration | Phase | Contents |
| - | --------- | ----- | -------- |
| 5 | `create_listings` | 5 | `listings` (seller, category, `kind` checked against `categories.allowed_listing_kinds`, title, description, `price_paise`, status, physical-only `condition` via check constraint, course/subject/ISBN metadata), `listing_images`, `digital_assets` (private object path, MIME, size, checksum, rights attestation). Tighten storage policies to listing ownership |
| 6 | `add_listing_search` | 4–5 | Generated `tsvector` + GIN index; trigram index if approved |
| 7 | `create_orders_and_payments` | 7 | `orders`, `order_items` (price snapshots), `payments`, `payment_events` (unique provider event id for idempotent webhooks) |
| 8 | `create_entitlements_and_fulfilment` | 8 | `entitlements`, `download_events` audit, `fulfilment_events` |
| 9 | `create_reports_and_moderation` | 8–10 | `reports`, `moderation_actions` audit |
| 10 | `create_ai_suggestions` | 9 | Seller-confirmed AI suggestions; embeddings (pgvector) only if approved |

### Open questions (needed before batch 5)

1. Persist carts in the database, or keep the cart client-side and create the order server-side?
2. Must listings be admin-approved before going `active` (adds a `pending_review` status)?
3. Can one listing have quantity > 1 (e.g. digital resources sold many times)?
4. Who is the designated remote-migration owner?
