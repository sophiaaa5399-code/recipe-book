-- 기존에 이미 만들어둔 프로젝트를 "기기 구분 없이 공개 접근" 방식으로 바꾸는 마이그레이션.
-- Supabase 대시보드 > SQL Editor 에서 한 번만 실행하세요.
-- 기존에 저장된 레시피는 그대로 남아있고, 앞으로는 기기/로그인 구분 없이 다 보이게 됩니다.

drop policy if exists "owner can select own recipes" on recipes;
drop policy if exists "owner can insert own recipes" on recipes;
drop policy if exists "owner can update own recipes" on recipes;
drop policy if exists "owner can delete own recipes" on recipes;

alter table recipes alter column owner_id drop not null;
alter table recipes alter column owner_id drop default;

create policy "anyone can select recipes"
  on recipes for select
  to anon, authenticated
  using (true);

create policy "anyone can insert recipes"
  on recipes for insert
  to anon, authenticated
  with check (true);

create policy "anyone can update recipes"
  on recipes for update
  to anon, authenticated
  using (true);

create policy "anyone can delete recipes"
  on recipes for delete
  to anon, authenticated
  using (true);

drop policy if exists "authenticated users can upload recipe images" on storage.objects;
drop policy if exists "authenticated users can update own recipe images" on storage.objects;
drop policy if exists "authenticated users can delete own recipe images" on storage.objects;

create policy "anyone can upload recipe images"
  on storage.objects for insert
  to anon, authenticated
  with check (bucket_id = 'recipe-images');

create policy "anyone can update recipe images"
  on storage.objects for update
  to anon, authenticated
  using (bucket_id = 'recipe-images');

create policy "anyone can delete recipe images"
  on storage.objects for delete
  to anon, authenticated
  using (bucket_id = 'recipe-images');
