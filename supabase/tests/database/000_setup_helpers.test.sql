-- Shared test helpers, installed once into a `tests` schema.
-- Runs first (file order) and commits so later test files can use them.
-- Local test database only; the `tests` schema is never part of migrations.

create extension if not exists pgtap with schema extensions;

create schema if not exists tests;
grant usage on schema tests to anon, authenticated;

-- Create an auth user (the on_auth_user_created trigger creates its profile).
create or replace function tests.create_user(user_id uuid, email text, display_name text default null)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into auth.users (id, aud, role, email, raw_user_meta_data, created_at, updated_at)
  values (
    user_id, 'authenticated', 'authenticated', email,
    case when display_name is null then '{}'::jsonb
         else jsonb_build_object('display_name', display_name) end,
    now(), now()
  );
  return user_id;
end;
$$;

-- Act as a signed-in user for the rest of the transaction.
create or replace function tests.authenticate_as(user_id uuid)
returns void
language plpgsql
as $$
begin
  perform set_config('request.jwt.claims',
    json_build_object('sub', user_id, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);
end;
$$;

-- Act as an anonymous visitor.
create or replace function tests.authenticate_as_anon()
returns void
language plpgsql
as $$
begin
  perform set_config('request.jwt.claims', json_build_object('role', 'anon')::text, true);
  perform set_config('role', 'anon', true);
end;
$$;

-- Return to the privileged test-runner role (for setup/assertions).
create or replace function tests.clear_authentication()
returns void
language plpgsql
as $$
begin
  perform set_config('role', 'postgres', true);
  perform set_config('request.jwt.claims', null, true);
end;
$$;

grant execute on all functions in schema tests to anon, authenticated;

begin;
select plan(1);
select has_function('tests', 'authenticate_as', array['uuid'], 'test helpers are installed');
select * from finish();
rollback;
