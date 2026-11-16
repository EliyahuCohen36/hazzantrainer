-- Letter trainer: the teacher opens the alef-bet one letter at a time (Alef, then Bet,
-- then Vet, Gimel …), for a class and per child. letters_open = how many letters, in
-- alef-bet order, are open. Safe to re-run.
alter table public.classes       add column if not exists letters_open int not null default 1;
alter table public.class_members add column if not exists letters_open int;  -- null = same as the class

create or replace function public.my_letters_open() returns int
language sql stable security definer set search_path = public as $$
  select case
    when (select role from profiles where id = auth.uid()) in ('admin','teacher','family') then 99
    else coalesce((
      select max(coalesce(m.letters_open, c.letters_open))
      from class_members m join classes c on c.id = m.class_id
      where m.student_id = auth.uid()), 1)
  end;
$$;
