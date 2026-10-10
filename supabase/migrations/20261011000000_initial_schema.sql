-- Initial schema for the personal brand manager beta.
-- Every user-owned table carries user_id and row-level security restricted to auth.uid().

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type prompt_channel as enum ('web_push', 'email', 'whatsapp');
create type entry_source as enum ('web', 'email', 'whatsapp', 'voice');
create type employer_policy as enum ('name', 'generic', 'never');
create type number_policy as enum ('exact', 'rounded', 'relative');
create type draft_kind as enum ('post_idea', 'post', 'comment', 'reply');
create type draft_status as enum ('idea', 'draft', 'ready', 'posted', 'discarded');
create type opportunity_kind as enum ('headhunter', 'invitation', 'meeting', 'inbound_lead', 'other');
create type profile_section as enum ('headline', 'about', 'experience', 'skills', 'featured');
create type suggestion_status as enum ('pending', 'approved', 'rejected', 'applied');
create type reach_source as enum ('screenshot', 'api', 'manual');

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create or replace function set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Profiles
-- ---------------------------------------------------------------------------
create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  headline text,
  timezone text not null default 'UTC',
  language text not null default 'en',
  prompt_time time not null default '19:00',
  prompt_channel prompt_channel not null default 'email',
  posts_per_week smallint not null default 3 check (posts_per_week between 0 and 14),
  target_industries text[] not null default '{}',
  target_roles text[] not null default '{}',
  onboarding_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger profiles_updated_at before update on profiles
  for each row execute function set_updated_at();

-- Create a profile row whenever a new auth user signs up.
create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'));
  insert into public.confidentiality_rules (user_id) values (new.id);
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Voice, pillars, confidentiality
-- ---------------------------------------------------------------------------
create table voice_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  summary text not null default '',
  traits jsonb not null default '{}'::jsonb,
  sample_posts text[] not null default '{}',
  updated_at timestamptz not null default now()
);
create trigger voice_profiles_updated_at before update on voice_profiles
  for each row execute function set_updated_at();

create table pillars (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  description text not null default '',
  position smallint not null default 0,
  created_at timestamptz not null default now()
);
create index pillars_user_idx on pillars (user_id, position);

create table confidentiality_rules (
  user_id uuid primary key references auth.users (id) on delete cascade,
  employer_name text,
  employer_policy employer_policy not null default 'generic',
  never_mention text[] not null default '{}',
  number_policy number_policy not null default 'rounded',
  updated_at timestamptz not null default now()
);
create trigger confidentiality_rules_updated_at before update on confidentiality_rules
  for each row execute function set_updated_at();

create trigger on_auth_user_created after insert on auth.users
  for each row execute function handle_new_user();

-- ---------------------------------------------------------------------------
-- Capture: journal entries and wins
-- ---------------------------------------------------------------------------
create table journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  entry_date date not null,
  raw_text text not null check (char_length(raw_text) between 1 and 8000),
  source entry_source not null default 'web',
  follow_up_question text,
  created_at timestamptz not null default now()
);
create index journal_entries_user_date_idx on journal_entries (user_id, entry_date desc);

create table wins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  journal_entry_id uuid references journal_entries (id) on delete set null,
  occurred_on date not null,
  summary text not null,
  impact text not null default '',
  metric text,
  skills text[] not null default '{}',
  pillar_id uuid references pillars (id) on delete set null,
  confidential boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index wins_user_date_idx on wins (user_id, occurred_on desc);
create trigger wins_updated_at before update on wins
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Creation: ideas, posts, comments, replies
-- ---------------------------------------------------------------------------
create table drafts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  kind draft_kind not null,
  status draft_status not null default 'draft',
  parent_id uuid references drafts (id) on delete set null,
  angle text,
  hook text,
  body text not null default '',
  hashtags text[] not null default '{}',
  source_win_ids uuid[] not null default '{}',
  context_text text,
  guardrails jsonb,
  planned_for date,
  posted_at timestamptz,
  post_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index drafts_user_kind_idx on drafts (user_id, kind, status, created_at desc);
create trigger drafts_updated_at before update on drafts
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Weekly refresh, scorecard, engagement
-- ---------------------------------------------------------------------------
create table opportunities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  kind opportunity_kind not null,
  description text not null default '',
  source text,
  occurred_on date not null default current_date,
  created_at timestamptz not null default now()
);
create index opportunities_user_date_idx on opportunities (user_id, occurred_on desc);

create table profile_suggestions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  week_start date not null,
  section profile_section not null,
  current_text text not null default '',
  proposed_text text not null,
  reason text not null default '',
  status suggestion_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index profile_suggestions_user_week_idx on profile_suggestions (user_id, week_start desc);
create trigger profile_suggestions_updated_at before update on profile_suggestions
  for each row execute function set_updated_at();

create table cv_versions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  version integer not null,
  storage_path text not null,
  change_summary text not null default '',
  created_at timestamptz not null default now(),
  unique (user_id, version)
);

create table reach_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  captured_on date not null,
  profile_views integer,
  post_impressions integer,
  followers integer,
  search_appearances integer,
  source reach_source not null default 'screenshot',
  created_at timestamptz not null default now()
);
create index reach_snapshots_user_date_idx on reach_snapshots (user_id, captured_on desc);

create table scorecards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  week_start date not null,
  data jsonb not null,
  created_at timestamptz not null default now(),
  unique (user_id, week_start)
);

create table watch_list (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  profile_url text,
  note text not null default '',
  created_at timestamptz not null default now()
);
create index watch_list_user_idx on watch_list (user_id);

-- ---------------------------------------------------------------------------
-- AI usage (written and read with the service role only)
-- ---------------------------------------------------------------------------
create table ai_usage (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users (id) on delete set null,
  task text not null,
  model text not null,
  input_tokens integer not null default 0,
  output_tokens integer not null default 0,
  cache_read_tokens integer not null default 0,
  cache_write_tokens integer not null default 0,
  stop_reason text,
  created_at timestamptz not null default now()
);
create index ai_usage_user_date_idx on ai_usage (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Row-level security
-- ---------------------------------------------------------------------------
alter table profiles enable row level security;
alter table voice_profiles enable row level security;
alter table pillars enable row level security;
alter table confidentiality_rules enable row level security;
alter table journal_entries enable row level security;
alter table wins enable row level security;
alter table drafts enable row level security;
alter table opportunities enable row level security;
alter table profile_suggestions enable row level security;
alter table cv_versions enable row level security;
alter table reach_snapshots enable row level security;
alter table scorecards enable row level security;
alter table watch_list enable row level security;
alter table ai_usage enable row level security; -- no policies: service role only

create policy "own profile" on profiles
  for all using (id = auth.uid()) with check (id = auth.uid());

do $$
declare
  t text;
begin
  foreach t in array array[
    'voice_profiles', 'pillars', 'confidentiality_rules', 'journal_entries', 'wins', 'drafts',
    'opportunities', 'profile_suggestions', 'cv_versions', 'reach_snapshots', 'scorecards',
    'watch_list'
  ]
  loop
    execute format(
      'create policy "own rows" on %I for all using (user_id = auth.uid()) with check (user_id = auth.uid())',
      t
    );
  end loop;
end;
$$;
