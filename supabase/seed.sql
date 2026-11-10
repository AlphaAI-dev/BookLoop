-- BookLoop LOCAL / DEMO seed data.
--
-- Runs automatically on `supabase db reset` against the LOCAL stack only.
-- Never run this file against the shared remote project or production.
-- The accounts below are fake (@example.com) and the password is a published
-- local-only demo value.
--
-- Demo accounts (password for all: bookloop-demo-123):
--   student@example.com  — student seller
--   creator@example.com  — creator/educator seller
--   admin@example.com    — admin (granted via user_roles)
--
-- Categories are NOT seeded here: they are reference data created by the
-- categories migration so every environment has them.

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
)
values
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-8000-000000000001',
   'authenticated', 'authenticated', 'student@example.com',
   extensions.crypt('bookloop-demo-123', extensions.gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}', '{"display_name":"Asha (demo student)"}',
   now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-8000-000000000002',
   'authenticated', 'authenticated', 'creator@example.com',
   extensions.crypt('bookloop-demo-123', extensions.gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}', '{"display_name":"Dev (demo creator)"}',
   now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-8000-000000000003',
   'authenticated', 'authenticated', 'admin@example.com',
   extensions.crypt('bookloop-demo-123', extensions.gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}', '{"display_name":"Demo admin"}',
   now(), now(), '', '', '', '');

insert into auth.identities (
  id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
)
select
  gen_random_uuid(), u.id, u.id::text,
  jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true),
  'email', now(), now(), now()
from auth.users u
where u.email in ('student@example.com', 'creator@example.com', 'admin@example.com');

-- Profiles were created by the on_auth_user_created trigger; enrich them.
update public.profiles
set username = 'demo_student', seller_type = 'student', institution = 'Demo University',
    bio = 'Second-year engineering student selling finished-module textbooks.'
where id = '00000000-0000-4000-8000-000000000001';

update public.profiles
set username = 'demo_creator', seller_type = 'creator',
    bio = 'Independent tutor publishing original exam-prep packs.'
where id = '00000000-0000-4000-8000-000000000002';

update public.profiles
set username = 'demo_admin'
where id = '00000000-0000-4000-8000-000000000003';

insert into public.user_roles (user_id, role)
values ('00000000-0000-4000-8000-000000000003', 'admin');
