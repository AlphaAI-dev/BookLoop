-- Profiles: created on signup, publicly readable, editable only by the owner
-- and only in allowed columns.
begin;
select plan(17);

select tests.create_user('11111111-1111-4111-8111-111111111111', 'alice@test.local', '  Alice  ');
select tests.create_user('22222222-2222-4222-8222-222222222222', 'bob@test.local');
select tests.create_user('33333333-3333-4333-8333-333333333333', 'long@test.local', repeat('x', 200));

-- Signup trigger
select is((select display_name from public.profiles where id = '11111111-1111-4111-8111-111111111111'),
  'Alice', 'signup creates a profile using the trimmed display name');
select is((select display_name from public.profiles where id = '22222222-2222-4222-8222-222222222222'),
  'BookLoop member', 'signup without a display name uses the default');
select is((select char_length(display_name) from public.profiles where id = '33333333-3333-4333-8333-333333333333'),
  80, 'over-long display names are clamped to 80 characters');

-- Public read
select tests.authenticate_as_anon();
select ok((select count(*) from public.profiles where id in (
  '11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222222')) = 2,
  'anonymous visitors can read profiles');

-- Anonymous protected action (playbook negative test)
select throws_ok(
  $$ update public.profiles set display_name = 'hacked' where id = '11111111-1111-4111-8111-111111111111' $$,
  '42501', null, 'anonymous visitors cannot update profiles');

-- Owner edits
select tests.authenticate_as('11111111-1111-4111-8111-111111111111');
select lives_ok(
  $$ update public.profiles
        set display_name = 'Alice A.', username = 'alice_a', bio = 'Hi', seller_type = 'student'
      where id = '11111111-1111-4111-8111-111111111111' $$,
  'owner can update editable profile fields');

-- User edits another user's profile (playbook negative test)
update public.profiles set display_name = 'pwned' where id = '22222222-2222-4222-8222-222222222222';
select tests.clear_authentication();
select is((select display_name from public.profiles where id = '22222222-2222-4222-8222-222222222222'),
  'BookLoop member', 'a user cannot update another user''s profile (RLS filters the row)');
select is((select username from public.profiles where id = '11111111-1111-4111-8111-111111111111'),
  'alice_a', 'owner update was persisted');

select tests.authenticate_as('11111111-1111-4111-8111-111111111111');
select throws_ok(
  $$ update public.profiles set id = '22222222-2222-4222-8222-222222222222'
      where id = '11111111-1111-4111-8111-111111111111' $$,
  '42501', null, 'owner cannot change the profile id (column not granted)');
select throws_ok(
  $$ update public.profiles set created_at = now() - interval '1 year'
      where id = '11111111-1111-4111-8111-111111111111' $$,
  '42501', null, 'owner cannot change created_at (column not granted)');
select throws_ok(
  $$ insert into public.profiles (id, display_name)
     values ('44444444-4444-4444-8444-444444444444', 'Fake') $$,
  '42501', null, 'users cannot insert profiles directly');
select throws_ok(
  $$ delete from public.profiles where id = '11111111-1111-4111-8111-111111111111' $$,
  '42501', null, 'users cannot delete profiles directly');

-- Validation
select throws_ok(
  $$ update public.profiles set username = 'Bad Name!' where id = '11111111-1111-4111-8111-111111111111' $$,
  '23514', null, 'usernames must match ^[a-z0-9_]{3,30}$');
select throws_ok(
  $$ update public.profiles set avatar_path = '22222222-2222-4222-8222-222222222222/a.png'
      where id = '11111111-1111-4111-8111-111111111111' $$,
  '23514', null, 'avatar_path must point into the owner''s own folder');
select lives_ok(
  $$ update public.profiles set avatar_path = '11111111-1111-4111-8111-111111111111/a.png'
      where id = '11111111-1111-4111-8111-111111111111' $$,
  'avatar_path inside the owner''s folder is accepted');
select throws_ok(
  $$ update public.profiles set display_name = '   ' where id = '11111111-1111-4111-8111-111111111111' $$,
  '23514', null, 'display name cannot be blank');

-- Unique usernames
select tests.authenticate_as('22222222-2222-4222-8222-222222222222');
select throws_ok(
  $$ update public.profiles set username = 'alice_a' where id = '22222222-2222-4222-8222-222222222222' $$,
  '23505', null, 'usernames are unique');

select * from finish();
rollback;
