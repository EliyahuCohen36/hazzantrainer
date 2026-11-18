-- Keriah Trainer: school domains (Google sign-in), changeable codes, free testers,
-- class settings (sections the class may use, script letters).
-- Run once in Supabase: Dashboard -> SQL Editor -> New query -> paste -> Run.
-- Safe to run again. Run it after schema.sql, levels.sql, beginner.sql and letters.sql.

alter table public.schools add column if not exists domain text unique;           -- e.g. barkai.org
alter table public.classes add column if not exists script_open boolean not null default false;
alter table public.classes add column if not exists sections text[];               -- null = everything
alter table public.profiles add column if not exists free_access boolean not null default false;

-- Codes are always stored in capitals, and a code is used only once in the whole site
-- (a school code and a class code can't be the same).
create or replace function public.code_taken(p_code text, p_not uuid default null) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from schools where teacher_code = upper(trim(p_code)) and id is distinct from p_not)
      or exists (select 1 from classes where code = upper(trim(p_code)) and id is distinct from p_not);
$$;

-- The owner changes a school's code (the code teachers use to join the school).
create or replace function public.set_school_code(p_school uuid, p_code text) returns text
language plpgsql security definer set search_path = public as $$
declare v text := upper(regexp_replace(trim(p_code), '\s+', '', 'g'));
begin
  if not is_admin() then raise exception 'Only the site owner can change a school code.'; end if;
  if length(v) < 4 then raise exception 'A code needs at least 4 letters or numbers.'; end if;
  if code_taken(v, p_school) then raise exception 'That code is already used. Please choose another.'; end if;
  update schools set teacher_code = v where id = p_school;
  return v;
end $$;

-- A teacher changes the code of their class (the code students use to join it).
create or replace function public.set_class_code(p_class uuid, p_code text) returns text
language plpgsql security definer set search_path = public as $$
declare v text := upper(regexp_replace(trim(p_code), '\s+', '', 'g'));
begin
  if not (teaches_class(p_class) or is_admin()) then raise exception 'This is not your class.'; end if;
  if length(v) < 4 then raise exception 'A code needs at least 4 letters or numbers.'; end if;
  if code_taken(v, p_class) then raise exception 'That code is already used. Please choose another.'; end if;
  update classes set code = v where id = p_class;
  return v;
end $$;

-- Google sign-in: a new account whose email ends with a school's domain joins that school
-- as a student by itself (if the licence is current and there's a free seat). The teacher
-- then adds the student to a class.
create or replace function public.claim_school_domain() returns text
language plpgsql security definer set search_path = public as $$
declare
  v_email text;
  v_school schools%rowtype;
  v_used int;
begin
  if auth.uid() is null then return null; end if;
  if (select role from profiles where id = auth.uid()) <> 'none' then return null; end if;
  select lower(email) into v_email from auth.users where id = auth.uid();
  select * into v_school from schools where domain is not null and lower(domain) = split_part(v_email, '@', 2);
  if not found then return null; end if;
  if v_school.paid_until is null or v_school.paid_until < current_date then return null; end if;
  select count(*) into v_used from profiles where school_id = v_school.id and role = 'student';
  if v_used >= v_school.seats then return null; end if;
  update profiles set role = 'student', school_id = v_school.id,
         display_name = coalesce(display_name, (select raw_user_meta_data->>'full_name' from auth.users where id = auth.uid()))
   where id = auth.uid();
  return 'student';
end $$;

-- Students at the teacher's school who aren't in any class yet (joined by their school email).
create or replace function public.school_unassigned_students()
returns table (id uuid, display_name text, email text)
language sql stable security definer set search_path = public as $$
  select p.id, p.display_name, u.email::text
  from profiles p join auth.users u on u.id = p.id
  where p.role = 'student'
    and p.school_id = (select school_id from profiles where id = auth.uid())
    and (select role from profiles where id = auth.uid()) in ('teacher','admin')
    and not exists (select 1 from class_members m where m.student_id = p.id)
  order by p.display_name;
$$;

create or replace function public.teacher_add_student(p_class uuid, p_student uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not (teaches_class(p_class) or is_admin()) then raise exception 'This is not your class.'; end if;
  if (select school_id from profiles where id = p_student) is distinct from (select school_id from classes where id = p_class) then
    raise exception 'That student is at another school.';
  end if;
  insert into class_members (class_id, student_id) values (p_class, p_student) on conflict do nothing;
end $$;

-- The owner gives someone free access (family and friends testing before the site is public).
-- They make an account first (Sign in with Google, or Subscribe → create account).
create or replace function public.admin_grant_free(p_email text, p_until date) returns text
language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  if not is_admin() then raise exception 'Only the site owner can do this.'; end if;
  select id into v_id from auth.users where lower(email) = lower(trim(p_email));
  if v_id is null then raise exception 'No account with that email yet. Ask them to sign in once first.'; end if;
  update profiles set role = case when role in ('none','family') then 'family' else role end,
                      paid_until = p_until, free_access = (p_until is not null)
   where id = v_id;
  return 'ok';
end $$;

create or replace function public.admin_free_list()
returns table (id uuid, email text, display_name text, paid_until date)
language sql stable security definer set search_path = public as $$
  select p.id, u.email::text, p.display_name, p.paid_until
  from profiles p join auth.users u on u.id = p.id
  where p.free_access and is_admin()
  order by u.email;
$$;

-- What the signed-in student's class allows: the sections to show and the script letters.
create or replace function public.my_class_settings() returns json
language sql stable security definer set search_path = public as $$
  select case
    when (select role from profiles where id = auth.uid()) <> 'student' then json_build_object('script_open', true, 'sections', null)
    else (
      select json_build_object(
        'script_open', coalesce(bool_or(c.script_open), false),
        'sections', case when bool_or(c.sections is null) then null
                         else (select array_agg(distinct x) from classes c2 join class_members m2 on m2.class_id = c2.id,
                                 unnest(c2.sections) x where m2.student_id = auth.uid()) end)
      from class_members m join classes c on c.id = m.class_id
      where m.student_id = auth.uid())
  end;
$$;

grant execute on function public.set_school_code(uuid, text), public.set_class_code(uuid, text),
  public.claim_school_domain(), public.school_unassigned_students(), public.teacher_add_student(uuid, uuid),
  public.admin_grant_free(text, date), public.admin_free_list(), public.my_class_settings() to authenticated;
