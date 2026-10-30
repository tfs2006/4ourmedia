-- 4ourmedia-promogen migration 003: Muse AI Quick-Start course progress
-- Run this ONCE in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.
-- It is safe to run twice (IF NOT EXISTS guards + DROP POLICY IF EXISTS).

create table if not exists public.course_progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  completed_lessons text[] not null default '{}',
  updated_at timestamptz not null default now()
);
alter table public.course_progress enable row level security;
drop policy if exists "users own course_progress" on public.course_progress;
create policy "users own course_progress" on public.course_progress
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
