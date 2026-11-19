-- The owner's own wording, colours and home-page tabs (SiteEditor.tsx, src/lib/site-edits.ts).
-- Everyone can read them; only the admin can change them. Run once in the SQL editor; safe to re-run.

create table if not exists public.site_settings (
  key        text primary key,
  value      jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.site_settings enable row level security;
drop policy if exists site_settings_read  on public.site_settings;
drop policy if exists site_settings_admin on public.site_settings;
create policy site_settings_read  on public.site_settings for select using (true);
create policy site_settings_admin on public.site_settings for all using (public.is_admin()) with check (public.is_admin());
grant select on public.site_settings to anon, authenticated;
