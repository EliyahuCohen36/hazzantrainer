-- Te'amim recordings for the teacher (owner's request, Nov 19 2026).
-- A school student records a ta'am; their teacher listens and gives a grade from 1 to 10.
-- 7 or more passes: the ta'am counts as learned, and when every recording of a level has
-- passed, the child's next te'amim level opens by itself.
-- Run once in the Supabase SQL editor after schema.sql, levels.sql and accounts.sql. Safe to re-run.

create table if not exists public.taam_submissions (
  id         uuid primary key default gen_random_uuid(),
  student_id uuid not null default auth.uid() references public.profiles on delete cascade,
  tune       text not null default 'torah',  -- torah, neviim, tehillim, …
  src        text not null,                  -- the Hazzan's recording it was sung after
  label      text not null default '',       -- the ta'am's name, for the teacher
  level      int,                            -- te'amim level (Torah trainer only)
  needed     int,                            -- recordings in that level that must pass
  path       text not null,                  -- the child's file in the "submissions" bucket
  created_at timestamptz not null default now(),
  grade      int check (grade between 1 and 10),
  graded_by  uuid references public.profiles,
  graded_at  timestamptz
);
create index if not exists taam_submissions_student on public.taam_submissions (student_id, created_at desc);

alter table public.taam_submissions enable row level security;
drop policy if exists subs_insert_own on public.taam_submissions;
drop policy if exists subs_select_own on public.taam_submissions;
drop policy if exists subs_teacher    on public.taam_submissions;
drop policy if exists subs_admin      on public.taam_submissions;
create policy subs_insert_own on public.taam_submissions for insert
  with check (student_id = auth.uid() and grade is null and my_role() = 'student');
create policy subs_select_own on public.taam_submissions for select using (student_id = auth.uid());
create policy subs_teacher    on public.taam_submissions for select using (teaches_student(student_id));
create policy subs_admin      on public.taam_submissions for all using (is_admin()) with check (is_admin());

-- The children's recordings: a private bucket, one folder per child (<user id>/…).
insert into storage.buckets (id, name, public) values ('submissions', 'submissions', false)
on conflict (id) do update set public = false;

drop policy if exists submissions_insert on storage.objects;
drop policy if exists submissions_read   on storage.objects;
drop policy if exists submissions_delete on storage.objects;
create policy submissions_insert on storage.objects for insert
  with check (bucket_id = 'submissions' and (storage.foldername(name))[1] = auth.uid()::text);
create policy submissions_read on storage.objects for select
  using (bucket_id = 'submissions' and (
    (storage.foldername(name))[1] = auth.uid()::text
    or public.is_admin()
    or public.teaches_student(((storage.foldername(name))[1])::uuid)));
create policy submissions_delete on storage.objects for delete
  using (bucket_id = 'submissions' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));

-- A grade can only come from the teacher (save_practice refuses "graded:" keys).
create or replace function public.save_practice(p_key text, p_score int) returns int
language plpgsql security definer set search_path = public as $$
declare v_best int;
begin
  if p_key like 'graded:%' then return 0; end if;
  insert into progress (user_id, kind, key, best) values (auth.uid(), 'practice', p_key, p_score)
  on conflict (user_id, kind, key) do update
    set best = greatest(progress.best, excluded.best), updated_at = now()
  returning best into v_best;
  return v_best;
end $$;

-- The teacher's list: their students' recordings, newest first (ungraded first).
create or replace function public.teacher_submissions() returns table (
  id uuid, student_id uuid, student text, tune text, src text, label text, level int,
  path text, created_at timestamptz, grade int)
language sql stable security definer set search_path = public as $$
  select s.id, s.student_id, coalesce(nullif(p.display_name, ''), p.username, ''),
         s.tune, s.src, s.label, s.level, s.path, s.created_at, s.grade
  from taam_submissions s join profiles p on p.id = s.student_id
  where public.is_admin() or public.teaches_student(s.student_id)
  order by (s.grade is null) desc, s.created_at desc
  limit 300;
$$;

-- Grade a recording (1-10). 7+ passes; returns 'level-up' when the child's next level opened.
create or replace function public.grade_submission(p_id uuid, p_grade int) returns text
language plpgsql security definer set search_path = public as $$
declare s taam_submissions; v_passed int;
begin
  select * into s from taam_submissions where id = p_id;
  if s.id is null then raise exception 'Recording not found'; end if;
  if not (public.is_admin() or public.teaches_student(s.student_id)) then raise exception 'Not your student'; end if;
  if p_grade < 1 or p_grade > 10 then raise exception 'The grade must be 1 to 10'; end if;
  update taam_submissions set grade = p_grade, graded_by = auth.uid(), graded_at = now() where id = p_id;
  -- The child's best grade for this ta'am (×10), so their trainer shows it as learned.
  insert into progress (user_id, kind, key, best) values (s.student_id, 'practice', 'graded:' || s.src, p_grade * 10)
  on conflict (user_id, kind, key) do update set best = greatest(progress.best, excluded.best), updated_at = now();
  if p_grade >= 7 and s.level is not null and s.tune = 'torah' then
    select count(distinct src) into v_passed from taam_submissions
      where student_id = s.student_id and tune = 'torah' and level = s.level and grade >= 7;
    if v_passed >= coalesce(s.needed, 1) then
      update class_members m set unlocked_level = greatest(coalesce(m.unlocked_level, c.unlocked_level), s.level + 1)
        from classes c
        where c.id = m.class_id and m.student_id = s.student_id
          and (public.is_admin() or c.teacher_id = auth.uid())
          and coalesce(m.unlocked_level, c.unlocked_level) <= s.level;
      if found then return 'level-up'; end if;
    end if;
  end if;
  return 'ok';
end $$;
