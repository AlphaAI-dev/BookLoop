-- Categories: active ones public, inactive visible to admins only, no API writes.
begin;
select plan(8);

select tests.create_user('11111111-1111-4111-8111-111111111111', 'alice@test.local');
select tests.create_user('55555555-5555-4555-8555-555555555555', 'admin@test.local');
insert into public.user_roles (user_id, role) values ('55555555-5555-4555-8555-555555555555', 'admin');
insert into public.categories (slug, name, allowed_listing_kinds, is_active)
values ('retired-category', 'Retired', array['physical']::public.listing_kind[], false);

select tests.authenticate_as_anon();
select is((select count(*) from public.categories), 5::bigint,
  'anonymous visitors see only the five active categories');
select is((select count(*) from public.categories where slug = 'retired-category'), 0::bigint,
  'inactive categories are hidden from anonymous visitors');

select tests.authenticate_as('11111111-1111-4111-8111-111111111111');
select is((select count(*) from public.categories where slug = 'retired-category'), 0::bigint,
  'inactive categories are hidden from regular users');
select throws_ok(
  $$ insert into public.categories (slug, name, allowed_listing_kinds)
     values ('sneaky', 'Sneaky', array['digital']::public.listing_kind[]) $$,
  '42501', null, 'regular users cannot create categories');
select throws_ok(
  $$ update public.categories set allowed_listing_kinds = array['digital']::public.listing_kind[]
      where slug = 'textbooks' $$,
  '42501', null, 'regular users cannot change permitted listing kinds');
select throws_ok(
  $$ delete from public.categories where slug = 'textbooks' $$,
  '42501', null, 'regular users cannot delete categories');

select tests.authenticate_as('55555555-5555-4555-8555-555555555555');
select is((select count(*) from public.categories), 6::bigint,
  'admins can read inactive categories too');
select throws_ok(
  $$ update public.categories set is_active = true where slug = 'retired-category' $$,
  '42501', null, 'admins cannot write categories through the client API either');

select * from finish();
rollback;
