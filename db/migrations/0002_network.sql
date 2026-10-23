-- Network: the relationships that bring the next role. Search firms that place people like the
-- user, and people worth knowing at competitors and companies they'd join. Everything here is
-- typed in by the user or chosen from our public firm directory (src/lib/network/firms.ts);
-- nothing is fetched from LinkedIn or bought from a contact database, and nothing is sent for the
-- user. Private to each user: row-level security on every table.

create type network_kind as enum ('search_firm', 'competitor', 'target_company', 'peer', 'other');
create type contact_stage as enum ('to_contact', 'contacted', 'in_conversation', 'warm', 'dormant');
create type interaction_kind as enum ('message_sent', 'message_received', 'call', 'meeting', 'intro', 'note');
create type role_stage as enum ('heard', 'exploring', 'interviewing', 'offer', 'closed');

-- The user's answers that the first suggestions are built from. One row per user.
create table network_goals (
  user_id uuid primary key references users (id) on delete cascade,
  target_roles text[] not null default '{}',
  functions text[] not null default '{}',
  sectors text[] not null default '{}',
  seniority text check (seniority in ('manager', 'vp_director', 'cxo', 'board')),
  markets text[] not null default '{}',
  cities text[] not null default '{}',
  current_company text check (char_length(current_company) <= 120),
  competitors text[] not null default '{}',
  target_companies text[] not null default '{}',
  timeline text not null default 'ready' check (timeline in ('ready', 'year', 'now')),
  -- What the user can offer others, so outreach gives before it asks.
  offer text not null default '' check (char_length(offer) <= 300),
  completed_at timestamptz,
  updated_at timestamptz not null default now()
);
create trigger network_goals_updated_at before update on network_goals
  for each row execute function set_updated_at();

-- A person; or, until the user adds a name, a firm or a role at a company.
create table network_contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users (id) on delete cascade,
  kind network_kind not null,
  name text not null check (char_length(name) between 1 and 120),
  -- True until the user adds the person's name: a firm from the directory, or a suggested role.
  unnamed boolean not null default false,
  title text check (char_length(title) <= 160),
  organisation text check (char_length(organisation) <= 160),
  -- The directory entry this came from, if any (a slug in src/lib/network/firms.ts).
  firm_id text check (char_length(firm_id) <= 80),
  email text check (char_length(email) <= 320),
  -- A link the user pasted. Opened only in the user's own browser; never fetched.
  profile_url text check (char_length(profile_url) <= 500),
  how_met text check (char_length(how_met) <= 200),
  notes text not null default '' check (char_length(notes) <= 4000),
  stage contact_stage not null default 'to_contact',
  next_step text check (char_length(next_step) <= 200),
  next_step_on date,
  last_contact_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index network_contacts_user_next_idx on network_contacts (user_id, next_step_on);
create index network_contacts_user_stage_idx on network_contacts (user_id, stage, updated_at desc);
create trigger network_contacts_updated_at before update on network_contacts
  for each row execute function set_updated_at();

-- The conversation log: what was said, when, and how.
create table network_interactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users (id) on delete cascade,
  contact_id uuid not null references network_contacts (id) on delete cascade,
  kind interaction_kind not null,
  summary text not null check (char_length(summary) between 1 and 2000),
  occurred_on date not null default current_date,
  created_at timestamptz not null default now()
);
create index network_interactions_contact_idx on network_interactions (contact_id, occurred_on desc);
create index network_interactions_user_date_idx on network_interactions (user_id, occurred_on desc);

-- Roles the user hears about, and who they came through.
create table network_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users (id) on delete cascade,
  contact_id uuid references network_contacts (id) on delete set null,
  title text not null check (char_length(title) between 1 and 160),
  organisation text check (char_length(organisation) <= 160),
  location text check (char_length(location) <= 120),
  stage role_stage not null default 'heard',
  notes text not null default '' check (char_length(notes) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index network_roles_user_stage_idx on network_roles (user_id, stage, updated_at desc);
create trigger network_roles_updated_at before update on network_roles
  for each row execute function set_updated_at();

-- The latest AI suggestions of companies and roles worth knowing (never people's names), kept so
-- the page doesn't call the model on every visit. Rebuilt when the user asks or changes answers.
create table network_suggestions (
  user_id uuid primary key references users (id) on delete cascade,
  data jsonb not null,
  created_at timestamptz not null default now()
);

do $$
declare
  t text;
begin
  foreach t in array array[
    'network_goals', 'network_contacts', 'network_interactions', 'network_roles', 'network_suggestions'
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

-- An interaction or role may only point at the same user's contact.
create function network_contact_is_own() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.contact_id is not null and not exists (
    select 1 from public.network_contacts c where c.id = new.contact_id and c.user_id = new.user_id
  ) then
    raise exception 'contact belongs to another user';
  end if;
  return new;
end;
$$;
create trigger network_interactions_own_contact before insert or update on network_interactions
  for each row execute function network_contact_is_own();
create trigger network_roles_own_contact before insert or update on network_roles
  for each row execute function network_contact_is_own();

revoke all on network_goals, network_contacts, network_interactions, network_roles, network_suggestions from public;
revoke all on function network_contact_is_own() from public;
grant select, insert, update, delete on
  network_goals, network_contacts, network_interactions, network_roles, network_suggestions
to pbm_user, pbm_service;
