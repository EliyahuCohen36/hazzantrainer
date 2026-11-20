-- How many questions each Beginner Keriah step asks, and how many must be right (owner, Nov 20 2026).
-- The teacher sets them per class in /teacher/ ({"nekudot": {"n": 35, "pass": 25}, "sheva": {...}, ...}).
-- Run once in the SQL editor after accounts.sql. Safe to re-run.

alter table public.classes add column if not exists questions jsonb;

create or replace function public.my_class_settings() returns json
language sql stable security definer set search_path = public as $$
  select case
    when (select role from profiles where id = auth.uid()) <> 'student' then json_build_object('script_open', true, 'sections', null, 'questions', null)
    else (
      select json_build_object(
        'script_open', coalesce(bool_or(c.script_open), false),
        'sections', case when bool_or(c.sections is null) then null
                         else (select array_agg(distinct x) from classes c2 join class_members m2 on m2.class_id = c2.id,
                                 unnest(c2.sections) x where m2.student_id = auth.uid()) end,
        'questions', (select c3.questions from classes c3 join class_members m3 on m3.class_id = c3.id
                      where m3.student_id = auth.uid() and c3.questions is not null limit 1))
      from class_members m join classes c on c.id = m.class_id
      where m.student_id = auth.uid())
  end;
$$;
grant execute on function public.my_class_settings() to authenticated;
