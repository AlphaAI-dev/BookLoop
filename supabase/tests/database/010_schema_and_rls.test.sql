-- Structural guarantees: RLS everywhere, private helpers locked down,
-- buckets configured, reference categories present.
begin;
select plan(19);

select has_table('public', 'profiles', 'profiles table exists');
select has_table('public', 'user_roles', 'user_roles table exists');
select has_table('public', 'categories', 'categories table exists');

-- Guard rail for every current AND future table in the exposed schema.
select is(
  (select array_agg(c.relname::text order by c.relname)
     from pg_class c
     join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind in ('r', 'p')
      and not c.relrowsecurity),
  null::text[],
  'every table in public has row level security enabled'
);

select ok(not has_function_privilege('anon', 'private.is_admin()', 'execute'),
  'anon cannot execute private.is_admin()');
select ok(not has_function_privilege('authenticated', 'private.handle_new_user()', 'execute'),
  'authenticated cannot execute the signup trigger function');
select ok(not has_function_privilege('anon', 'private.handle_new_user()', 'execute'),
  'anon cannot execute the signup trigger function');
select ok(not has_table_privilege('authenticated', 'public.user_roles', 'insert'),
  'authenticated has no insert privilege on user_roles');
select ok(not has_table_privilege('authenticated', 'public.categories', 'insert'),
  'authenticated has no insert privilege on categories');

-- Storage buckets
select is((select public from storage.buckets where id = 'digital-resources'), false,
  'digital-resources bucket is private');
select is((select public from storage.buckets where id = 'avatars'), true,
  'avatars bucket is public-read');
select is((select public from storage.buckets where id = 'listing-images'), true,
  'listing-images bucket is public-read');
select is((select file_size_limit from storage.buckets where id = 'avatars'), 2097152::bigint,
  'avatars limited to 2 MB');
select is((select file_size_limit from storage.buckets where id = 'listing-images'), 5242880::bigint,
  'listing-images limited to 5 MB');
select is((select file_size_limit from storage.buckets where id = 'digital-resources'), 52428800::bigint,
  'digital-resources limited to 50 MB');
select ok(
  (select 'image/svg+xml' <> all (allowed_mime_types) from storage.buckets where id = 'listing-images'),
  'listing-images does not accept SVG (script-capable) uploads');

-- Reference categories and permitted listing types (approved mapping)
select results_eq(
  $$ select slug, allowed_listing_kinds::text[] from public.categories order by sort_order $$,
  $$ values
       ('textbooks',         array['physical']),
       ('notes',             array['physical','digital']),
       ('equipment',         array['physical']),
       ('exam-prep',         array['physical','digital']),
       ('digital-resources', array['digital']) $$,
  'five canonical categories with the approved listing kinds'
);

select throws_ok(
  $$ insert into public.categories (slug, name, allowed_listing_kinds)
     values ('empty-kinds', 'Empty', array[]::public.listing_kind[]) $$,
  '23514', null,
  'a category must allow at least one listing kind'
);

select throws_ok(
  $$ insert into public.categories (slug, name, allowed_listing_kinds)
     values ('Bad Slug!', 'Bad', array['physical']::public.listing_kind[]) $$,
  '23514', null,
  'category slugs must be lowercase kebab-case'
);

select * from finish();
rollback;
