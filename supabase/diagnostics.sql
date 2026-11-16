-- Sound/microphone check reports from /beginner/check/, so the owner (admin) can see
-- what works on each device. Safe to re-run.
create table if not exists public.diagnostics (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete cascade default auth.uid(),
  created_at timestamptz not null default now(),
  report jsonb not null
);
alter table public.diagnostics enable row level security;
drop policy if exists "diag insert own" on public.diagnostics;
create policy "diag insert own" on public.diagnostics for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "diag admin read" on public.diagnostics;
create policy "diag admin read" on public.diagnostics for select to authenticated using (public.is_admin());
