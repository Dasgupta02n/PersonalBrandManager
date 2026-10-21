-- The app's database, self-hosted PostgreSQL. Consolidates the earlier Supabase migrations
-- (supabase/migrations/, kept for history) and replaces Supabase Auth with our own tables.
--
-- Access model (fail closed):
--   pbm_app      the app's login. Owns nothing and has no privileges of its own, so every query
--                must first switch role inside a transaction (src/lib/db/client.ts).
--   pbm_user     what a signed-in user's queries run as. Row-level security limits every
--                user-owned table to rows where user_id = app_user_id().
--   pbm_service  trusted server code: sign-in, sessions, usage logging, account deletion,
--                billing. Bypasses row-level security.
-- The runner (scripts/migrate.mjs) creates pbm_app and sets its password from the environment.

-- ---------------------------------------------------------------------------
-- Roles
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (select from pg_roles where rolname = 'pbm_user') then
    create role pbm_user nologin;
  end if;
  if not exists (select from pg_roles where rolname = 'pbm_service') then
    create role pbm_service nologin bypassrls;
  end if;
end;
$$;

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
create type profile_section as enum ('headline', 'about', 'experience', 'skills', 'featured', 'cv');
create type suggestion_status as enum ('pending', 'approved', 'rejected', 'applied');
create type reach_source as enum ('screenshot', 'api', 'manual');
create type post_tone as enum ('reserved', 'balanced', 'open');
create type win_kind as enum ('result', 'decision', 'unblocked', 'helped', 'praise', 'lesson');
create type post_format as enum ('lesson', 'decision', 'credit', 'how_to');
create type plan_kind as enum ('beta', 'trial', 'member');

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create function set_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- The signed-in user for this transaction, set by the app; null outside a user's request.
create function app_user_id() returns uuid
language sql stable set search_path = '' as $$
  select nullif(current_setting('app.user_id', true), '')::uuid
$$;

-- ---------------------------------------------------------------------------
-- Accounts and sign-in (replaces Supabase Auth). Server-only: pbm_service.
-- ---------------------------------------------------------------------------
create table users (
  id uuid primary key default gen_random_uuid(),
  email text not null check (char_length(email) between 3 and 320),
  created_at timestamptz not null default now(),
  last_sign_in_at timestamptz
);
create unique index users_email_idx on users (lower(email));

-- One email = one code and one link. Only keyed hashes are stored (HMAC with AUTH_SECRET), so a
-- copy of the database alone cannot be used to sign in.
create table sign_in_codes (
  id bigint generated always as identity primary key,
  email text not null,
  code_hash text not null,
  link_hash text not null unique,
  next_path text not null default '/today',
  ip_hash text,
  attempts smallint not null default 0,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);
create index sign_in_codes_email_idx on sign_in_codes (lower(email), created_at desc);
create index sign_in_codes_ip_idx on sign_in_codes (ip_hash, created_at desc);

-- The cookie holds a random token; the table holds only its keyed hash.
create table sessions (
  token_hash text primary key,
  user_id uuid not null references users (id) on delete cascade,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  expires_at timestamptz not null
);
create index sessions_user_idx on sessions (user_id);

-- ---------------------------------------------------------------------------
-- Profiles
-- ---------------------------------------------------------------------------
create table profiles (
  id uuid primary key references users (id) on delete cascade,
  full_name text,
  headline text,
  timezone text not null default 'UTC',
  language text not null default 'en',
  prompt_time time not null default '19:00',
  prompt_channel prompt_channel not null default 'email',
  posts_per_week smallint not null default 3 check (posts_per_week between 0 and 14),
  target_industries text[] not null default '{}',
  target_roles text[] not null default '{}',
  tone post_tone not null default 'balanced',
  routine_cue text check (char_length(routine_cue) <= 120),
  onboarding_completed_at timestamptz,
  -- Consent to the privacy notice (DPDP, GDPR): when, and to which version.
  privacy_consent_at timestamptz,
  privacy_notice_version text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger profiles_updated_at before update on profiles
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Voice, pillars, confidentiality
-- ---------------------------------------------------------------------------
create table voice_profiles (
  user_id uuid primary key references users (id) on delete cascade,
  summary text not null default '',
  traits jsonb not null default '{}'::jsonb,
  sample_posts text[] not null default '{}',
  -- The private style notebook: [{ "key": "ai:1" | "you:<uuid>", "text": "...", "source": "learned" | "you" }]
  notes jsonb not null default '[]'::jsonb,
  -- Keys of observations the user removed, so they are never suggested again.
  muted text[] not null default '{}',
  -- Counts from edits, dismissed ideas and revisions (no text beyond single words removed).
  edit_stats jsonb not null default '{}'::jsonb,
  refreshed_at timestamptz,
  updated_at timestamptz not null default now()
);
create trigger voice_profiles_updated_at before update on voice_profiles
  for each row execute function set_updated_at();

create table pillars (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  description text not null default '',
  position smallint not null default 0,
  created_at timestamptz not null default now()
);
create index pillars_user_idx on pillars (user_id, position);

create table confidentiality_rules (
  user_id uuid primary key references users (id) on delete cascade,
  employer_name text,
  employer_policy employer_policy not null default 'generic',
  never_mention text[] not null default '{}',
  number_policy number_policy not null default 'rounded',
  no_go_topics text[] not null default '{}',
  -- Keep other people's names out of stored notes and wins (refer to them by role).
  mask_names boolean not null default true,
  -- Regulated firms: extra checks for promissory and performance language.
  regulated boolean not null default false,
  updated_at timestamptz not null default now()
);
create trigger confidentiality_rules_updated_at before update on confidentiality_rules
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Plans. Written only by trusted server code (sign-up, billing webhooks); users read their own.
-- ---------------------------------------------------------------------------
create table subscriptions (
  user_id uuid primary key references users (id) on delete cascade,
  plan plan_kind not null default 'beta',
  billing_interval text check (billing_interval in ('month', 'year')),
  started_at timestamptz not null default now(),
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  provider text,
  provider_customer_id text,
  provider_subscription_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger subscriptions_updated_at before update on subscriptions
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Capture: journal entries and wins
-- ---------------------------------------------------------------------------
create table journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users (id) on delete cascade,
  entry_date date not null,
  raw_text text not null check (char_length(raw_text) between 1 and 8000),
  source entry_source not null default 'web',
  follow_up_question text,
  created_at timestamptz not null default now()
);
create index journal_entries_user_date_idx on journal_entries (user_id, entry_date desc);

create table wins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users (id) on delete cascade,
  journal_entry_id uuid references journal_entries (id) on delete set null,
  occurred_on date not null,
  summary text not null,
  impact text not null default '',
  metric text,
  skills text[] not null default '{}',
  pillar_id uuid references pillars (id) on delete set null,
  confidential boolean not null default false,
  kind win_kind not null default 'result',
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
  user_id uuid not null references users (id) on delete cascade,
  kind draft_kind not null,
  status draft_status not null default 'draft',
  parent_id uuid references drafts (id) on delete set null,
  post_format post_format,
  angle text,
  hook text,
  body text not null default '',
  -- The last version the AI wrote, so the user's edits before posting can be learned from.
  ai_body text,
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
  user_id uuid not null references users (id) on delete cascade,
  kind opportunity_kind not null,
  description text not null default '',
  source text,
  occurred_on date not null default current_date,
  created_at timestamptz not null default now()
);
create index opportunities_user_date_idx on opportunities (user_id, occurred_on desc);

create table profile_suggestions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users (id) on delete cascade,
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
  user_id uuid not null references users (id) on delete cascade,
  version integer not null,
  storage_path text not null,
  change_summary text not null default '',
  created_at timestamptz not null default now(),
  unique (user_id, version)
);

create table reach_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users (id) on delete cascade,
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
  user_id uuid not null references users (id) on delete cascade,
  week_start date not null,
  data jsonb not null,
  created_at timestamptz not null default now(),
  unique (user_id, week_start)
);

create table watch_list (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users (id) on delete cascade,
  name text not null,
  profile_url text,
  note text not null default '',
  created_at timestamptz not null default now()
);
create index watch_list_user_idx on watch_list (user_id);

-- ---------------------------------------------------------------------------
-- A new account starts with an empty profile, default confidentiality rules and the beta plan.
-- ---------------------------------------------------------------------------
create function handle_new_user() returns trigger
language plpgsql set search_path = '' as $$
begin
  insert into public.profiles (id) values (new.id);
  insert into public.confidentiality_rules (user_id) values (new.id);
  insert into public.subscriptions (user_id) values (new.id);
  return new;
end;
$$;
create trigger users_after_insert after insert on users
  for each row execute function handle_new_user();

-- ---------------------------------------------------------------------------
-- AI usage: written and read by server code only (no content, just task, model and cost).
-- ---------------------------------------------------------------------------
create table ai_usage (
  id bigint generated always as identity primary key,
  user_id uuid references users (id) on delete set null,
  task text not null,
  model text not null,
  provider text,
  cost_usd numeric(12, 6),
  input_tokens integer not null default 0,
  output_tokens integer not null default 0,
  cache_read_tokens integer not null default 0,
  cache_write_tokens integer not null default 0,
  stop_reason text,
  created_at timestamptz not null default now()
);
create index ai_usage_user_date_idx on ai_usage (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Row-level security: a user's queries see and change only their own rows.
-- ---------------------------------------------------------------------------
alter table profiles enable row level security;
create policy own_profile on profiles for all to pbm_user
  using (id = app_user_id()) with check (id = app_user_id());

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
    execute format('alter table %I enable row level security', t);
    execute format(
      'create policy own_rows on %I for all to pbm_user using (user_id = app_user_id()) with check (user_id = app_user_id())',
      t
    );
  end loop;
end;
$$;

alter table subscriptions enable row level security;
create policy read_own_subscription on subscriptions for select to pbm_user using (user_id = app_user_id());

-- Server-only tables: row-level security on with no user policies, so pbm_user sees nothing even
-- if it were ever granted access.
alter table users enable row level security;
alter table sign_in_codes enable row level security;
alter table sessions enable row level security;
alter table ai_usage enable row level security;

-- ---------------------------------------------------------------------------
-- Privileges
-- ---------------------------------------------------------------------------
revoke all on all tables in schema public from public;
revoke all on all functions in schema public from public;
grant usage on schema public to pbm_user, pbm_service;
grant execute on function app_user_id() to pbm_user, pbm_service;

grant select, insert, update, delete on
  profiles, voice_profiles, pillars, confidentiality_rules, journal_entries, wins, drafts,
  opportunities, profile_suggestions, cv_versions, reach_snapshots, scorecards, watch_list
to pbm_user;
grant select on subscriptions to pbm_user;

grant select, insert, update, delete on all tables in schema public to pbm_service;
grant usage, select on all sequences in schema public to pbm_service;
