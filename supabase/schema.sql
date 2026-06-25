-- FitFlow cloud storage schema.
-- Run this in your Supabase project: SQL Editor -> New query -> paste -> Run.
--
-- One key-value table per user. The app stores its "ff.*" JSON blobs here,
-- one row per key (survey, logs, meals, water, etc.). Row Level Security
-- ensures each user can only ever read/write their own rows.

create table if not exists public.user_data (
  user_id    uuid        not null references auth.users (id) on delete cascade,
  key        text        not null,
  value      jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, key)
);

alter table public.user_data enable row level security;

drop policy if exists "user_data is private to owner" on public.user_data;
create policy "user_data is private to owner"
  on public.user_data
  for all
  to authenticated
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);
