-- BL-002 · Migration 1/4 — shared helpers and enums.
--
-- `private` holds internal functions. It is NOT listed in the API's exposed
-- schemas (supabase/config.toml [api].schemas / dashboard "Exposed schemas"),
-- so nothing in it is reachable through PostgREST. RLS policies may still call
-- functions here when the caller's role has USAGE + EXECUTE.

create schema if not exists private;

revoke all on schema private from public;
grant usage on schema private to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

-- Every listing is either a physical item or a digital resource (playbook §2).
create type public.listing_kind as enum ('physical', 'digital');

-- Privileged application roles. Buyer/seller are capabilities of every
-- account, not roles. Admin is never self-assigned (see user_roles).
create type public.app_role as enum ('admin');

-- Self-declared seller persona shown on profiles. Grants no permissions.
create type public.seller_type as enum ('student', 'educator', 'creator');

-- ---------------------------------------------------------------------------
-- updated_at trigger
-- ---------------------------------------------------------------------------

create function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

revoke all on function private.set_updated_at() from public, anon, authenticated;
