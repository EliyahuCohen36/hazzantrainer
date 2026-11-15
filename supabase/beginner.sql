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
