-- Privileged roles: never self-assigned, only own rows visible.
begin;
select plan(9);

select tests.create_user('11111111-1111-4111-8111-111111111111', 'alice@test.local');
select tests.create_user('55555555-5555-4555-8555-555555555555', 'admin@test.local');
-- Granted by the database owner (test runner), as documented for real admins.
insert into public.user_roles (user_id, role) values ('55555555-5555-4555-8555-555555555555', 'admin');

-- User assigns self admin (playbook negative test)
select tests.authenticate_as('11111111-1111-4111-8111-111111111111');
select throws_ok(
  $$ insert into public.user_roles (user_id, role) values ('11111111-1111-4111-8111-111111111111', 'admin') $$,
  '42501', null, 'a user cannot assign themselves the admin role');
select throws_ok(
  $$ update public.user_roles set user_id = '11111111-1111-4111-8111-111111111111'
      where user_id = '55555555-5555-4555-8555-555555555555' $$,
  '42501', null, 'a user cannot take over another user''s role row');
select throws_ok(
  $$ delete from public.user_roles where user_id = '55555555-5555-4555-8555-555555555555' $$,
  '42501', null, 'a user cannot delete role rows');
select is((select count(*) from public.user_roles), 0::bigint,
  'a non-admin sees no role rows (only their own, of which there are none)');
select is((select private.is_admin()), false, 'is_admin() is false for a regular user');

select tests.authenticate_as('55555555-5555-4555-8555-555555555555');
select is((select count(*) from public.user_roles where user_id = '55555555-5555-4555-8555-555555555555'),
  1::bigint, 'an admin can read their own role row');
select is((select private.is_admin()), true, 'is_admin() is true for an admin');
select throws_ok(
  $$ insert into public.user_roles (user_id, role) values ('11111111-1111-4111-8111-111111111111', 'admin') $$,
  '42501', null, 'even an admin cannot grant roles through the client API');

select tests.authenticate_as_anon();
select throws_ok($$ select * from public.user_roles $$, '42501', null,
  'anonymous visitors cannot read user_roles');

select * from finish();
rollback;
