-- BL-002 · Migration 2/4 — profiles and the privileged-role model.
--
-- profiles   : one row per auth user, public-safe fields only. Created by a
--              trigger on signup; owners may edit a fixed set of columns.
-- user_roles : privileged roles (admin). No API role can write it, so admin
--              can never be self-assigned. Grant admin with SQL as the DB owner.

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------

create table public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  username     text unique
               constraint profiles_username_format check (username ~ '^[a-z0-9_]{3,30}$'),
  display_name text not null default 'BookLoop member'
               constraint profiles_display_name_length
                 check (char_length(btrim(display_name)) between 1 and 80),
  avatar_path  text
               constraint profiles_avatar_path_owned
                 check (
                   avatar_path is null
                   or (avatar_path like id::text || '/%' and char_length(avatar_path) <= 512)
                 ),
  bio          text constraint profiles_bio_length check (char_length(bio) <= 500),
  institution  text constraint profiles_institution_length check (char_length(institution) <= 120),
  seller_type  public.seller_type,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

comment on table public.profiles is
  'Public profile for each auth user. Holds public-safe fields only; never store private contact data here.';
comment on column public.profiles.avatar_path is
  'Object path in the avatars bucket; must start with "<profile id>/".';
comment on column public.profiles.seller_type is
  'Self-declared seller persona (student/educator/creator). Display only; grants no permissions.';

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function private.set_updated_at();

alter table public.profiles enable row level security;

-- Table privileges (Supabase grants ALL to API roles by default; narrow them).
revoke all on table public.profiles from anon, authenticated;
grant select on table public.profiles to anon, authenticated;
-- Column-level grant: owners may change only these columns, never id/timestamps.
grant update (username, display_name, avatar_path, bio, institution, seller_type)
  on table public.profiles to authenticated;

create policy "Profiles are publicly readable"
  on public.profiles for select
  to anon, authenticated
  using (true);

create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- No insert/delete policies: rows are created by the signup trigger below and
-- removed by the cascade when the auth user is deleted.

-- ---------------------------------------------------------------------------
-- Create a profile for every new auth user
-- ---------------------------------------------------------------------------

create function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_name text;
begin
  -- raw_user_meta_data is user-controlled: only an optional display name is
  -- read, trimmed and clamped. Usernames are chosen later (must be unique).
  requested_name := left(btrim(coalesce(new.raw_user_meta_data ->> 'display_name', '')), 80);

  insert into public.profiles (id, display_name)
  values (new.id, coalesce(nullif(requested_name, ''), 'BookLoop member'));

  return new;
end;
$$;

revoke all on function private.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

-- ---------------------------------------------------------------------------
-- user_roles
-- ---------------------------------------------------------------------------

create table public.user_roles (
  user_id    uuid not null references auth.users (id) on delete cascade,
  role       public.app_role not null,
  granted_at timestamptz not null default now(),
  granted_by uuid references auth.users (id) on delete set null,
  primary key (user_id, role)
);

comment on table public.user_roles is
  'Privileged roles. Writable only by the service role / database owner — never through the client API.';

create index user_roles_granted_by_idx on public.user_roles (granted_by);

alter table public.user_roles enable row level security;

revoke all on table public.user_roles from anon, authenticated;
grant select on table public.user_roles to authenticated;

create policy "Users can read their own roles"
  on public.user_roles for select
  to authenticated
  using ((select auth.uid()) = user_id);

-- Intentionally no insert/update/delete policies or grants for API roles.

-- ---------------------------------------------------------------------------
-- Role helper for RLS policies
-- ---------------------------------------------------------------------------

-- SECURITY DEFINER so policies can check roles without granting broad reads on
-- user_roles. Always evaluates the caller's own uid.
create function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = (select auth.uid())
      and role = 'admin'
  );
$$;

revoke all on function private.is_admin() from public, anon;
grant execute on function private.is_admin() to authenticated, service_role;
