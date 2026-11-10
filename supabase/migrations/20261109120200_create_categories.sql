-- BL-002 · Migration 3/4 — resource categories and permitted listing types.
--
-- Categories are reference data required in every environment, so the
-- canonical rows are inserted here (not in seed.sql, which is local/demo only).
-- Change categories later with a new migration, never by editing this one.

create table public.categories (
  id                    uuid primary key default gen_random_uuid(),
  slug                  text not null unique
                        constraint categories_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name                  text not null
                        constraint categories_name_length check (char_length(btrim(name)) between 1 and 80),
  description           text not null default ''
                        constraint categories_description_length check (char_length(description) <= 300),
  allowed_listing_kinds public.listing_kind[] not null
                        constraint categories_allowed_kinds_not_empty
                          check (cardinality(allowed_listing_kinds) between 1 and 2),
  sort_order            integer not null default 0,
  is_active             boolean not null default true,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

comment on table public.categories is
  'Marketplace resource categories. allowed_listing_kinds limits which listing types a seller may create in each.';

create index categories_active_sort_idx on public.categories (is_active, sort_order);

create trigger categories_set_updated_at
  before update on public.categories
  for each row execute function private.set_updated_at();

alter table public.categories enable row level security;

revoke all on table public.categories from anon, authenticated;
grant select on table public.categories to anon, authenticated;

create policy "Active categories are publicly readable"
  on public.categories for select
  to anon, authenticated
  using (is_active);

create policy "Admins can read all categories"
  on public.categories for select
  to authenticated
  using ((select private.is_admin()));

-- No write policies: categories change through migrations, or later through a
-- trusted server-side admin workflow using the service role.

-- ---------------------------------------------------------------------------
-- Canonical categories (approved mapping, BL-002)
-- ---------------------------------------------------------------------------

insert into public.categories (slug, name, description, allowed_listing_kinds, sort_order)
values
  ('textbooks',
   'Used textbooks',
   'Course books passed on by students who finished the module.',
   array['physical']::public.listing_kind[],
   10),
  ('notes',
   'Notes & study guides',
   'Original notes and summaries written by the students who took the course.',
   array['physical', 'digital']::public.listing_kind[],
   20),
  ('equipment',
   'Academic equipment',
   'Calculators, lab kits, drawing instruments and other course essentials.',
   array['physical']::public.listing_kind[],
   30),
  ('exam-prep',
   'Exam preparation',
   'Practice sets, revision packs and worked solutions for upcoming exams.',
   array['physical', 'digital']::public.listing_kind[],
   40),
  ('digital-resources',
   'Digital resources',
   'Original educational files from educators and independent creators.',
   array['digital']::public.listing_kind[],
   50);
