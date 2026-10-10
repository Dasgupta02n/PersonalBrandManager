# Build status

## Milestone 1 — foundation and first slice (done)

- Product spec, architecture, schema with row-level security (verified: signup trigger, per-user isolation)
- Sign-in: email magic link; Google, Microsoft and LinkedIn buttons (providers must be enabled in Supabase)
- Onboarding: name, role, topic pillars, audience, confidentiality rules, voice samples, prompt time
- Today: log a win → AI extracts structured wins (+ optional follow-up question) → 3 post ideas
- Drafts: write a post from an idea → deterministic + AI checks (confidentiality, facts, job-search signals,
  clichés) with one automatic fix → edit, copy, open LinkedIn, mark as posted
- Engage: paste a post → 3 comment options, checked
- Wins bank: browse and delete
- AI usage recorded per user (`ai_usage`)
- Checks: lint, typecheck, 29 unit tests, production build

## Needed to run end to end

- Supabase project (apply `supabase/migrations/`, set auth redirect URL to `<APP_URL>/auth/callback`)
- Anthropic API key
- Hosting for the Next.js app

## Next milestones

2. Daily prompt delivery (email first, then WhatsApp and web push) via `/api/cron/tick`
3. Voice profile generation from samples / LinkedIn export import; CV upload
4. Weekly refresh: profile suggestions, CV versions (DOCX/PDF)
5. Weekly scorecard: opportunities log, consistency, profile strength, reach from screenshot
6. Billing, data export/deletion, admin console, monitoring
7. Desktop browser extension for "draft comment"

## Known limitations

- Re-saving settings replaces topic pillars, which unlinks existing wins from their pillar.
