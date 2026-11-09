# Database migration plan (proposal)

Status: **proposal for owner review**. Nothing here is implemented in BL-001. Migrations are
written in BL-002 and later phases, tested locally (`supabase db reset`) and applied to the shared
remote only by the designated database owner after merge (playbook §6).

## Conventions

- One coherent change per migration: `supabase migration new <verb_noun>`.
- `uuid` primary keys (`gen_random_uuid()`); `created_at` / `updated_at timestamptz` with a shared
  `set_updated_at()` trigger.
- Money: `bigint` **paise** with `check (amount >= 0)`; `currency text default 'INR'`.
- Status columns use Postgres enums; state transitions are enforced in services and, where
  practical, by constraints/triggers.
- RLS enabled on **every** table in exposed schemas, in the same migration that creates it.
- Privileged functions: `security definer` with `set search_path = ''` and fully qualified names.
- Files are never stored in the database, only Storage object paths.
- Seed data lives in `supabase/seed.sql` (local/demo only).

## Proposed batches

| # | Migration | Phase | Contents |
| - | --------- | ----- | -------- |
| 1 | `create_extensions_and_helpers` | BL-002 | Extensions as needed, `set_updated_at()` trigger fn, shared enums |
| 2 | `create_profiles_and_roles` | BL-002 | `profiles` (1:1 with `auth.users`, created by an `on auth.users insert` trigger); `user_roles` (admin) writable only by service role; `is_admin()` security-definer helper |
| 3 | `create_categories` | BL-002 | `categories` (slug, name, description, allowed listing kinds, sort order, active flag); seeded with the five categories |
| 4 | `create_listings` | BL-002/5 | `listings` (seller, category, `kind` physical/digital, title, description, `price_paise`, status `draft/active/archived/removed`, physical-only `condition` enforced by a check constraint, course/subject/ISBN metadata); `listing_images`; `digital_assets` (private object path, MIME, size, checksum, rights attestation timestamp) |
| 5 | `create_storage_buckets_and_policies` | BL-002 | Buckets `listing-images` (public read, owner write, type/size limits), `digital-resources` (**private**, owner upload only, no public read; served via signed URLs), `avatars` |
| 6 | `add_listing_search` | 4 | Generated `tsvector` + GIN index; trigram index if approved |
| 7 | `create_orders_and_payments` | 6–7 | `orders` (buyer, status `pending_payment/paid/failed/cancelled/refunded`, `total_paise`, unique `provider_order_id`); `order_items` (listing/seller/price snapshot, kind, fulfilment status); `payments` (unique provider payment id, amount, verified/captured timestamps); `payment_events` (unique provider event id, type, payload, processed_at) for idempotent webhooks |
| 8 | `create_entitlements_and_fulfilment` | 8 | `entitlements` (buyer × digital asset, from a paid order item, unique, revocable); `download_events` audit; `fulfilment_events` for physical order status history |
| 9 | `create_reports_and_moderation` | 11 | `reports` (reporter, listing, reason, status); `moderation_actions` audit (admin, target, action, reason) |
| 10 | `create_ai_suggestions` | 9 | AI metadata suggestions pending seller confirmation; embeddings (pgvector) only if approved |

## RLS intent (to be tested in BL-002 and later)

| Table | Read | Write |
| ----- | ---- | ----- |
| `profiles` | Public fields readable; full row by owner | Owner updates allowed fields only; no role fields |
| `user_roles` | Own row | Service role only (no self-assigned admin) |
| `categories` | Everyone (active only) | Admin via server |
| `listings` / `listing_images` | Everyone: `status = 'active'`; seller: own rows in any status | Seller: own rows; `seller_id` forced to `auth.uid()` |
| `digital_assets` | Seller: own. Buyers never read the row directly; the server issues signed URLs | Seller: own |
| `orders` | Buyer: own | Server only (service role) — totals computed server-side |
| `order_items` | Buyer: own orders; seller: items for own listings | Server only |
| `payments`, `payment_events` | No client access | Server only (webhook / verification handlers) |
| `entitlements`, `download_events` | Buyer: own | Server only |
| `reports` | Reporter: own; admin via server | Authenticated users create |
| `moderation_actions` | Admin via server | Server only |

Required negative tests (playbook §10) map onto these policies and will be written as pgTAP tests
(`supabase test db`) once the test approach is approved.

## Open questions for the owner

1. Persist carts in the database, or keep the cart client-side and create the order server-side
   at checkout? (A client-side cart is simpler; prices are recomputed on the server either way.)
2. Should listings need admin approval before going `active`? The playbook says "active, approved
   listings". If so, add a `pending_review` status.
3. Can one listing have quantity > 1 (e.g. digital resources sold many times, equipment in bulk)?
4. Who is the designated remote-migration owner?
