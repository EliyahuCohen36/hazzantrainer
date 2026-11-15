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
