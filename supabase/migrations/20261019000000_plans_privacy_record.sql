-- Plans and fair-use allowance, privacy consent, regulated-firm mode, name masking, CV suggestions.

-- ---------------------------------------------------------------------------
-- Plans. Written only by trusted server code (the sign-up trigger, billing webhooks):
-- users can read their own plan but never change it. The monthly AI allowance per plan is
-- in src/lib/billing/pricing.ts and is checked against ai_usage.
-- ---------------------------------------------------------------------------
create type plan_kind as enum ('beta', 'trial', 'member');

create table subscriptions (
  user_id uuid primary key references auth.users (id) on delete cascade,
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

alter table subscriptions enable row level security;
create policy "read own subscription" on subscriptions
  for select using (user_id = auth.uid());

insert into subscriptions (user_id) select id from auth.users on conflict do nothing;

-- Sign-up creates the profile, confidentiality rules and plan. During the private beta every
-- new user starts on 'beta'; switch the default to 'trial' when billing opens.
create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'));
  insert into public.confidentiality_rules (user_id) values (new.id);
  insert into public.subscriptions (user_id) values (new.id);
  return new;
end;
$$;
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Privacy
-- ---------------------------------------------------------------------------
-- Consent to the privacy notice (DPDP, GDPR): when it was given and to which version.
alter table profiles
  add column privacy_consent_at timestamptz,
  add column privacy_notice_version text;

-- Keep other people's names out of stored notes and wins (refer to them by role).
alter table confidentiality_rules
  add column mask_names boolean not null default true;

-- ---------------------------------------------------------------------------
-- Regulated firms (finance, insurance, investment): extra checks for promissory and
-- performance language, and a reminder to get the firm's approval before posting.
-- ---------------------------------------------------------------------------
alter table confidentiality_rules
  add column regulated boolean not null default false;

-- ---------------------------------------------------------------------------
-- Profile and CV refresh: CV bullets sit alongside the LinkedIn sections.
-- ---------------------------------------------------------------------------
alter type profile_section add value if not exists 'cv';
