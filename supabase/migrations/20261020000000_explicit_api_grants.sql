-- Explicit Data API grants.
--
-- From 30 October 2026 Supabase no longer grants new tables in "public" to anon, authenticated
-- and service_role automatically. Without grants, a fresh project, preview branch or local
-- `supabase db reset` would rebuild every table with no API access and the app would fail with
-- "permission denied". This migration grants each table explicitly, and only what the app needs.
-- Grants decide which roles can reach a table; row-level security still decides which rows.
--
-- Every later migration that creates a table must grant it in the same file.

-- Opt in now, so new tables start closed here too, as they will on every Supabase project.
alter default privileges for role postgres in schema public
  revoke select, insert, update, delete on tables from anon, authenticated, service_role;
alter default privileges for role postgres in schema public
  revoke execute on functions from anon, authenticated, service_role;
alter default privileges for role postgres in schema public
  revoke usage, select on sequences from anon, authenticated, service_role;
alter default privileges for role postgres in schema public
  revoke execute on functions from public;

-- Start from nothing: drop the broad grants the old defaults gave every role.
revoke all on table
  profiles, voice_profiles, pillars, confidentiality_rules, journal_entries, wins, drafts,
  opportunities, profile_suggestions, cv_versions, reach_snapshots, scorecards, watch_list,
  subscriptions, ai_usage
from anon, authenticated, service_role;
-- Identity columns don't need sequence grants to insert.
revoke all on sequence ai_usage_id_seq from anon, authenticated, service_role;

-- Signed-in users: their own rows, through the "own rows" and "own profile" policies.
grant select, insert, update, delete on table
  profiles, voice_profiles, pillars, confidentiality_rules, journal_entries, wins, drafts,
  opportunities, profile_suggestions, cv_versions, reach_snapshots, scorecards, watch_list
to authenticated;
-- Users can read their own plan but never change it.
grant select on table subscriptions to authenticated;
-- ai_usage: no access for users; written and read with the service role only.

-- Trusted server code (usage logging, allowance checks, billing webhooks).
grant select, insert, update, delete on table
  profiles, voice_profiles, pillars, confidentiality_rules, journal_entries, wins, drafts,
  opportunities, profile_suggestions, cv_versions, reach_snapshots, scorecards, watch_list,
  subscriptions, ai_usage
to service_role;

-- anon gets nothing: every page that reads data requires sign-in.
