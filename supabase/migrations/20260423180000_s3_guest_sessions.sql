create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  guest_id text not null unique,
  supabase_user_id uuid unique,
  kind text not null default 'guest' check (kind in ('guest')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  last_seen_at timestamptz not null default timezone('utc', now())
);

create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

create table if not exists public.learning_sessions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  module_id text not null,
  module_version text not null,
  lesson_slug text not null,
  status text not null check (status in ('started', 'completed', 'abandoned')),
  started_at timestamptz not null default timezone('utc', now()),
  completed_at timestamptz,
  latest_event_at timestamptz
);

create index if not exists learning_sessions_profile_id_idx
on public.learning_sessions(profile_id);

create index if not exists learning_sessions_lesson_slug_idx
on public.learning_sessions(lesson_slug);

create table if not exists public.session_events (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.learning_sessions(id) on delete cascade,
  client_event_id text not null,
  activity_id text not null,
  event_type text not null check (
    event_type in (
      'select',
      'drag-end',
      'drop',
      'submit',
      'hint-open',
      'retry',
      'free-text-submit',
      'complete'
    )
  ),
  payload jsonb not null default '{}'::jsonb,
  client_ts timestamptz not null,
  received_at timestamptz not null default timezone('utc', now()),
  unique(session_id, client_event_id)
);

create index if not exists session_events_session_id_idx
on public.session_events(session_id, received_at desc);

create table if not exists public.session_reports (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null unique references public.learning_sessions(id) on delete cascade,
  status text not null check (status in ('pending', 'ready', 'failed')),
  summary_json jsonb,
  generated_at timestamptz,
  generator_version text
);

alter table public.profiles enable row level security;
alter table public.learning_sessions enable row level security;
alter table public.session_events enable row level security;
alter table public.session_reports enable row level security;
