create table if not exists public.teacher_activities (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  grade_band text not null,
  concept text not null,
  goal text not null,
  difficulty text not null check (difficulty in ('easy', 'standard', 'challenge')),
  source_lesson_slug text not null,
  document_json jsonb not null,
  status text not null check (status in ('draft', 'published')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

drop trigger if exists set_teacher_activities_updated_at on public.teacher_activities;
create trigger set_teacher_activities_updated_at
before update on public.teacher_activities
for each row
execute function public.set_updated_at();

create table if not exists public.published_assignments (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references public.teacher_activities(id) on delete cascade,
  code text not null unique,
  status text not null check (status in ('active', 'closed')),
  published_at timestamptz not null default timezone('utc', now()),
  share_url text not null
);

create index if not exists published_assignments_activity_id_idx
on public.published_assignments(activity_id);

create index if not exists published_assignments_code_idx
on public.published_assignments(code);

alter table public.learning_sessions
add column if not exists assignment_id uuid references public.published_assignments(id) on delete set null;

create index if not exists learning_sessions_assignment_id_idx
on public.learning_sessions(assignment_id);

alter table public.teacher_activities enable row level security;
alter table public.published_assignments enable row level security;
