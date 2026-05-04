-- Relational integrity hardening for Rockstar Law MVP

alter table public.rosters
  add column if not exists course_id uuid;

update public.rosters r
set course_id = pc.course_id
from public.professor_courses pc
where r.professor_course_id = pc.id
  and r.course_id is null;

create or replace function public.sync_rosters_course_id()
returns trigger
language plpgsql
as $$
begin
  if new.professor_course_id is not null then
    select pc.course_id into new.course_id
    from public.professor_courses pc
    where pc.id = new.professor_course_id;
  end if;

  return new;
end;
$$;

drop trigger if exists sync_rosters_course_id on public.rosters;
create trigger sync_rosters_course_id
before insert or update of professor_course_id, course_id on public.rosters
for each row execute function public.sync_rosters_course_id();

update public.rosters r
set course_id = pc.course_id
from public.professor_courses pc
where r.professor_course_id = pc.id
  and r.course_id is null;

alter table public.rosters
  alter column course_id set not null;

alter table public.student_profiles drop constraint if exists student_profiles_university_id_fkey;
alter table public.professor_profiles drop constraint if exists professor_profiles_university_id_fkey;
alter table public.courses drop constraint if exists courses_school_id_fkey;
alter table public.rosters drop constraint if exists rosters_school_id_fkey;
alter table public.rosters drop constraint if exists rosters_course_id_fkey;
alter table public.roster_entries drop constraint if exists roster_entries_roster_id_fkey;
alter table public.roster_matches drop constraint if exists roster_matches_roster_entry_id_fkey;
alter table public.roster_matches drop constraint if exists roster_matches_student_id_fkey;
alter table public.student_professor_links drop constraint if exists student_professor_links_school_id_fkey;

alter table public.student_profiles
  add constraint student_profiles_university_id_fkey
  foreign key (university_id) references public.schools(id)
  on delete restrict;

alter table public.professor_profiles
  add constraint professor_profiles_university_id_fkey
  foreign key (university_id) references public.schools(id)
  on delete restrict;

alter table public.courses
  add constraint courses_school_id_fkey
  foreign key (school_id) references public.schools(id)
  on delete restrict;

alter table public.rosters
  add constraint rosters_school_id_fkey
  foreign key (school_id) references public.schools(id)
  on delete restrict;

alter table public.rosters
  add constraint rosters_course_id_fkey
  foreign key (course_id) references public.courses(id)
  on delete restrict;

alter table public.roster_entries
  add constraint roster_entries_roster_id_fkey
  foreign key (roster_id) references public.rosters(id)
  on delete cascade;

alter table public.roster_matches
  add constraint roster_matches_roster_entry_id_fkey
  foreign key (roster_entry_id) references public.roster_entries(id)
  on delete cascade;

alter table public.roster_matches
  add constraint roster_matches_student_id_fkey
  foreign key (student_id) references public.student_profiles(id)
  on delete restrict;

alter table public.student_professor_links
  add constraint student_professor_links_school_id_fkey
  foreign key (school_id) references public.schools(id)
  on delete restrict;
