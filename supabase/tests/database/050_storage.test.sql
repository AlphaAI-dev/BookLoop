-- Storage: owner-folder writes, private digital resources.
begin;
select plan(10);

select tests.create_user('11111111-1111-4111-8111-111111111111', 'alice@test.local');
select tests.create_user('22222222-2222-4222-8222-222222222222', 'bob@test.local');

select tests.authenticate_as('11111111-1111-4111-8111-111111111111');

select lives_ok(
  $$ insert into storage.objects (bucket_id, name)
     values ('avatars', '11111111-1111-4111-8111-111111111111/avatar.png') $$,
  'a user can upload an avatar into their own folder');
select throws_ok(
  $$ insert into storage.objects (bucket_id, name)
     values ('avatars', '22222222-2222-4222-8222-222222222222/avatar.png') $$,
  '42501', null, 'a user cannot upload into another user''s avatar folder');
select throws_ok(
  $$ insert into storage.objects (bucket_id, name)
     values ('listing-images', 'no-folder.png') $$,
  '42501', null, 'uploads outside any owner folder are rejected');
select lives_ok(
  $$ insert into storage.objects (bucket_id, name)
     values ('digital-resources', '11111111-1111-4111-8111-111111111111/notes.pdf') $$,
  'a seller can upload a digital resource into their own folder');
select is(
  (select count(*) from storage.objects
    where bucket_id = 'digital-resources' and name = '11111111-1111-4111-8111-111111111111/notes.pdf'),
  1::bigint, 'the owner can read their own private digital resource');

-- Unpaid access to private file (playbook negative test)
select tests.authenticate_as('22222222-2222-4222-8222-222222222222');
select is(
  (select count(*) from storage.objects where bucket_id = 'digital-resources'),
  0::bigint, 'another user cannot read someone else''s private digital resource');

update storage.objects set name = '22222222-2222-4222-8222-222222222222/stolen.pdf'
 where bucket_id = 'digital-resources' and name = '11111111-1111-4111-8111-111111111111/notes.pdf';
select tests.clear_authentication();
select is(
  (select count(*) from storage.objects
    where bucket_id = 'digital-resources' and name = '11111111-1111-4111-8111-111111111111/notes.pdf'),
  1::bigint, 'another user cannot move/rename someone else''s private file');

select tests.authenticate_as('22222222-2222-4222-8222-222222222222');
select is(
  (select count(*) from storage.objects
    where bucket_id = 'avatars' and name like '11111111-1111-4111-8111-111111111111/%'),
  0::bigint, 'users cannot list other users'' objects through the API (public URLs only)');

select tests.authenticate_as_anon();
select is(
  (select count(*) from storage.objects where bucket_id = 'digital-resources'),
  0::bigint, 'anonymous visitors cannot read private digital resources');
select throws_ok(
  $$ insert into storage.objects (bucket_id, name)
     values ('avatars', '11111111-1111-4111-8111-111111111111/anon.png') $$,
  '42501', null, 'anonymous visitors cannot upload files');

select * from finish();
rollback;
