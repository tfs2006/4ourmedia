-- 4ourmedia-promogen migration 002: Title Test Tracker + Hook Library unlocks
-- Run this ONCE in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.
-- It is safe to run twice (IF NOT EXISTS guards + DROP POLICY IF EXISTS).

-- 1. Title tests: the user's own A/B title experiments (logging is free)
create table if not exists public.title_tests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  video_name text not null,
  title text not null,
  ctr numeric,
  impressions integer,
  note text,
  created_at timestamptz default now()
);
alter table public.title_tests enable row level security;
drop policy if exists "users own title_tests" on public.title_tests;
create policy "users own title_tests" on public.title_tests
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index if not exists title_tests_user_video_idx
  on public.title_tests (user_id, video_name);

-- 2. Hook library unlocks: one row per user who paid the 5-credit unlock
create table if not exists public.hook_unlocks (
  user_id uuid primary key references auth.users(id) on delete cascade,
  unlocked_at timestamptz default now()
);
alter table public.hook_unlocks enable row level security;
drop policy if exists "users own hook_unlocks" on public.hook_unlocks;
create policy "users own hook_unlocks" on public.hook_unlocks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
