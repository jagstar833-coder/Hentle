-- Run this in your Supabase SQL Editor

-- 1. Daily words table
create table if not exists daily_words (
  id          uuid        default gen_random_uuid() primary key,
  word        text        not null check (char_length(word) = 5 and word ~ '^[a-z]+$'),
  date        date        not null unique,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- 2. Auto-update updated_at
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger daily_words_updated_at
  before update on daily_words
  for each row execute function update_updated_at();

-- 3. Row Level Security
alter table daily_words enable row level security;

-- Public (anon) can read today's word only
create policy "anon read today"
  on daily_words
  for select
  to anon
  using (date = current_date);

-- Authenticated users (admin) can read, insert, update, delete all
create policy "admin full access"
  on daily_words
  for all
  to authenticated
  using (true)
  with check (true);

-- 4. Index for fast date lookups
create index if not exists daily_words_date_idx on daily_words (date);
