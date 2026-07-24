-- 레시피북 스키마
-- Supabase 대시보드 > SQL Editor 에서 이 파일 내용을 그대로 붙여넣고 실행하세요.
--
-- 이 앱은 로그인이 없고, 기기 구분도 하지 않는다 (주소를 아는 사람은 누구나
-- 같은 데이터를 보고 관리할 수 있다 - 개인용 앱이라 의도된 설계).

create table if not exists recipes (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  image_url text,
  ingredients text[] not null default '{}',
  steps text[] not null default '{}',
  category text,
  tags text[] not null default '{}',
  source_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table recipes enable row level security;

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

-- 검색 성능을 위한 인덱스
create index if not exists recipes_title_idx on recipes using gin (to_tsvector('simple', title));
create index if not exists recipes_ingredients_idx on recipes using gin (ingredients);

-- updated_at 자동 갱신
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists recipes_set_updated_at on recipes;
create trigger recipes_set_updated_at
  before update on recipes
  for each row execute function set_updated_at();

-- Storage: recipe-images 버킷에 대한 업로드 정책
-- (버킷은 대시보드에서 'recipe-images' 이름으로 Public 버킷으로 미리 생성해두세요)
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
