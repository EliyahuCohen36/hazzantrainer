-- Kriah Trainer: accounts, schools, classes, progress and the private recordings.
-- Run once in Supabase: Dashboard -> SQL Editor -> New query -> paste -> Run.
-- Safe to run again (it drops and re-creates the functions and policies).

-- ---------------------------------------------------------------- tables

create table if not exists public.schools (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  seats        int  not null default 0,          -- student seats paid for
  paid_until   date,                              -- licence ends after this day
  teacher_code text not null unique default upper(substr(md5(random()::text), 1, 8)),
  created_at   timestamptz not null default now()
);

create table if not exists public.profiles (
  id           uuid primary key references auth.users on delete cascade,
  role         text not null default 'none' check (role in ('admin','teacher','student','family','none')),
  school_id    uuid references public.schools on delete set null,
  display_name text,
  username     text unique,
  -- Families who bought on their own (card checkout, later): access until this day.
  paid_until   date,
  created_at   timestamptz not null default now()
);

create table if not exists public.classes (
  id          uuid primary key default gen_random_uuid(),
  school_id   uuid not null references public.schools on delete cascade,
  teacher_id  uuid not null references public.profiles on delete cascade,
  name        text not null,
  code        text not null unique default upper(substr(md5(random()::text), 1, 6)),
  created_at  timestamptz not null default now()
);

create table if not exists public.class_members (
  class_id   uuid not null references public.classes on delete cascade,
  student_id uuid not null references public.profiles on delete cascade,
  joined_at  timestamptz not null default now(),
  primary key (class_id, student_id)
);

-- One row per student per thing practised: kind 'practice' (key = recording)
-- or 'quiz' (key = ta'am id).
create table if not exists public.progress (
  user_id    uuid not null references public.profiles on delete cascade,
  kind       text not null check (kind in ('practice','quiz')),
  key        text not null,
  best       int  not null default 0,   -- practice: best score 0-100
  right_n    int  not null default 0,   -- quiz: answers right
  total_n    int  not null default 0,   -- quiz: answers given
  updated_at timestamptz not null default now(),
  primary key (user_id, kind, key)
);

-- New sign-ups get an empty profile; they choose teacher/student by redeeming a code.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name, username)
  values (new.id,
          new.raw_user_meta_data->>'display_name',
          nullif(new.raw_user_meta_data->>'username', ''))
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------- helpers

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function public.my_school() returns uuid
language sql stable security definer set search_path = public as $$
  select school_id from profiles where id = auth.uid();
$$;

create or replace function public.my_role() returns text
language sql stable security definer set search_path = public as $$
  select role from profiles where id = auth.uid();
$$;

create or replace function public.in_class(p_class uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from class_members where class_id = p_class and student_id = auth.uid());
$$;

create or replace function public.teaches_class(p_class uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from classes where id = p_class and teacher_id = auth.uid());
$$;

create or replace function public.teaches_student(p_student uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from class_members m join classes c on c.id = m.class_id
                 where m.student_id = p_student and c.teacher_id = auth.uid());
$$;

-- Can the signed-in user use the trainer right now?
create or replace function public.has_access() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from profiles p
    left join schools s on s.id = p.school_id
    where p.id = auth.uid()
      and (
        p.role = 'admin'
        or (p.role in ('teacher','student') and s.paid_until >= current_date)
        or (p.role = 'family' and p.paid_until >= current_date)
      )
  );
$$;

-- Teacher code -> teacher at that school. Class code -> student in that class
-- (if the school still has a free seat).
create or replace function public.redeem_code(p_code text) returns text
language plpgsql security definer set search_path = public as $$
declare
  v_school schools%rowtype;
  v_class  classes%rowtype;
  v_used   int;
  v_role   text;
begin
  if auth.uid() is null then raise exception 'Not signed in'; end if;
  select role into v_role from profiles where id = auth.uid();

  select * into v_school from schools where teacher_code = upper(trim(p_code));
  if found then
    if v_role in ('admin') then return 'admin'; end if;
    update profiles set role = 'teacher', school_id = v_school.id where id = auth.uid();
    return 'teacher';
  end if;

  select * into v_class from classes where code = upper(trim(p_code));
  if not found then raise exception 'That code was not found. Check it with your teacher.'; end if;

  select * into v_school from schools where id = v_class.school_id;
  if v_school.paid_until is null or v_school.paid_until < current_date then
    raise exception 'Your school''s licence has ended. Please tell your teacher.';
  end if;

  if not exists (select 1 from profiles where id = auth.uid() and school_id = v_school.id) then
    select count(*) into v_used from profiles where school_id = v_school.id and role = 'student';
    if v_used >= v_school.seats then
      raise exception 'Your school has used all its student places. Please tell your teacher.';
    end if;
  end if;

  update profiles set role = case when role in ('admin','teacher') then role else 'student' end,
                      school_id = v_school.id
   where id = auth.uid();
  insert into class_members (class_id, student_id) values (v_class.id, auth.uid())
  on conflict do nothing;
  return 'student';
end $$;

-- Save a practice score (keeps the best) or a quiz answer.
create or replace function public.save_practice(p_key text, p_score int) returns int
language plpgsql security definer set search_path = public as $$
declare v_best int;
begin
  insert into progress (user_id, kind, key, best) values (auth.uid(), 'practice', p_key, p_score)
  on conflict (user_id, kind, key) do update
    set best = greatest(progress.best, excluded.best), updated_at = now()
  returning best into v_best;
  return v_best;
end $$;

create or replace function public.save_quiz(p_key text, p_right boolean) returns void
language plpgsql security definer set search_path = public as $$
begin
  insert into progress (user_id, kind, key, right_n, total_n)
  values (auth.uid(), 'quiz', p_key, case when p_right then 1 else 0 end, 1)
  on conflict (user_id, kind, key) do update
    set right_n = progress.right_n + excluded.right_n,
        total_n = progress.total_n + 1, updated_at = now();
end $$;

-- ---------------------------------------------------------------- security rules

alter table public.schools       enable row level security;
alter table public.profiles      enable row level security;
alter table public.classes       enable row level security;
alter table public.class_members enable row level security;
alter table public.progress      enable row level security;

do $$ declare r record; begin
  for r in select policyname, tablename from pg_policies
           where schemaname = 'public' and tablename in ('schools','profiles','classes','class_members','progress')
  loop execute format('drop policy %I on public.%I', r.policyname, r.tablename); end loop;
end $$;

-- Schools: admin does everything; teachers and students see their own school.
create policy schools_admin on public.schools for all using (is_admin()) with check (is_admin());
create policy schools_own   on public.schools for select using (id = my_school());

-- Profiles: everyone sees their own; teachers see their school's; admin sees all.
-- Only the admin can change roles or schools (students change their name through the app).
create policy profiles_self    on public.profiles for select using (id = auth.uid());
create policy profiles_school  on public.profiles for select using (school_id = my_school() and my_role() = 'teacher');
create policy profiles_admin   on public.profiles for all using (is_admin()) with check (is_admin());

-- Classes: teachers manage their own; students see the classes they're in.
create policy classes_teacher on public.classes for all
  using (teacher_id = auth.uid())
  with check (teacher_id = auth.uid() and school_id = my_school() and my_role() = 'teacher');
create policy classes_member on public.classes for select using (in_class(id));
create policy classes_admin on public.classes for all using (is_admin()) with check (is_admin());

create policy members_teacher on public.class_members for all using (teaches_class(class_id));
create policy members_self  on public.class_members for select using (student_id = auth.uid());
create policy members_admin on public.class_members for all using (is_admin()) with check (is_admin());

-- Progress: students read their own (writes go through save_practice/save_quiz);
-- teachers read their students'; admin reads all.
create policy progress_self on public.progress for select using (user_id = auth.uid());
create policy progress_teacher on public.progress for select using (teaches_student(user_id));
create policy progress_admin on public.progress for select using (is_admin());

-- ---------------------------------------------------------------- recordings

-- Private bucket: files are only handed out (as short-lived links) to users with access.
insert into storage.buckets (id, name, public) values ('recordings', 'recordings', false)
on conflict (id) do update set public = false;

drop policy if exists recordings_read  on storage.objects;
drop policy if exists recordings_admin on storage.objects;
create policy recordings_read on storage.objects for select
  using (bucket_id = 'recordings' and public.has_access());
create policy recordings_admin on storage.objects for all
  using (bucket_id = 'recordings' and public.is_admin())
  with check (bucket_id = 'recordings' and public.is_admin());

-- ---------------------------------------------------------------- make yourself admin
-- After you sign up on the site with your own email, run this one line
-- (with your email) to become the admin:
--   update public.profiles set role = 'admin' where id = (select id from auth.users where email = 'YOUR-EMAIL');
-- Te'amim levels: the teacher opens levels for a class (and can move one child
-- ahead or back). Run once in the SQL editor after schema.sql; safe to re-run.

alter table public.classes       add column if not exists unlocked_level int not null default 1;
alter table public.class_members add column if not exists unlocked_level int;  -- null = same as the class

-- The highest te'amim level the signed-in user may open.
-- Admins, teachers and families: all levels (99).
create or replace function public.my_level() returns int
language sql stable security definer set search_path = public as $$
  select case
    when (select role from profiles where id = auth.uid()) in ('admin','teacher','family') then 99
    else coalesce((
      select max(coalesce(m.unlocked_level, c.unlocked_level))
      from class_members m join classes c on c.id = m.class_id
      where m.student_id = auth.uid()), 1)
  end;
$$;
-- Beginner Keriah levels: the teacher opens them for a class, and can move one
-- child ahead or back. Run once after schema.sql / levels.sql; safe to re-run.
alter table public.classes       add column if not exists beginner_level int not null default 1;
alter table public.class_members add column if not exists beginner_level int;  -- null = same as the class

-- The highest Beginner Keriah level the signed-in user may open (teachers, admins, families: all).
create or replace function public.my_beginner_level() returns int
language sql stable security definer set search_path = public as $$
  select case
    when (select role from profiles where id = auth.uid()) in ('admin','teacher','family') then 99
    else coalesce((
      select max(coalesce(m.beginner_level, c.beginner_level))
      from class_members m join classes c on c.id = m.class_id
      where m.student_id = auth.uid()), 1)
  end;
$$;
