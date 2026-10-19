# Build status

## Milestone 1 — foundation and first slice (done)

- Product spec, architecture, schema with row-level security (verified: signup trigger, per-user isolation)
- Sign-in: email magic link; Google, Microsoft and LinkedIn buttons (providers must be enabled in Supabase)
- Onboarding: name, role, topic pillars, audience, confidentiality rules, voice samples, prompt time
- Today: log a win → AI extracts structured wins (+ optional follow-up question) → 3 post ideas
- Drafts: write a post from an idea → deterministic + AI checks (confidentiality, facts, job-search signals,
  clichés) with one automatic fix → edit, copy, open LinkedIn, mark as posted
- Engage: paste a post → 3 comment options, checked (now comment starters)
- Wins bank: browse and delete
- AI usage recorded per user (`ai_usage`): model, host, tokens and cost of every call
- Checks: lint, typecheck, unit tests, production build

## Milestone 1b — repositioning and redesign (done)

- Positioning "Nothing you'll regret posting", from the persona and UI-psychology research
  (`docs/research/`); design system in `docs/DESIGN.md`
- Data model: tone, routine cue, no-go topics, win kinds, post formats
- AI: every function pinned to Claude Opus 5.5 via OpenRouter with zero-data-retention hosts;
  new functions `how_it_reads`, `revise_draft`, `comment_starters`
- Guardrails in three tiers (block / note / suggestion); humblebrag, AI-tell, bait-closer and
  hashtag checks; hierarchy and no-go topic checks in the AI review
- UI rebuilt: five-step setup wizard, Today with forgiving workday count and comeback, draft
  workspace with verdict, "How it reads", revisions and LinkedIn preview, Drafts segments,
  comment starters, "Your record", new landing and sign-in pages, seal logo, light and dark themes
- Checks: lint, typecheck, 59 unit tests, production build; every screen screenshot-checked on
  phone and desktop

## Needed to run end to end

See `docs/DEPLOY.md`. Done: Supabase project in Mumbai with the schema applied and checked
(security advisor clean apart from the intentional service-role-only `ai_usage`); VPS firewall.
Open:
- Supabase auth URL configuration (Site URL and redirect URL)
- Image access on the VPS (public GHCR package, or a one-time `docker login ghcr.io`); the `edge` update is done
- `pbm` project on the VPS, with `OPENROUTER_API_KEY` added in Docker Manager
- Custom SMTP for sign-in emails before inviting beta users

## Next milestones

2. Daily prompt delivery (email first, then WhatsApp and web push) via `/api/cron/tick`
3. Voice profile generation from samples / LinkedIn export import; CV upload
4. Weekly refresh: profile suggestions, CV versions (DOCX/PDF)
5. Weekly scorecard: opportunities log, consistency, profile strength, reach from screenshot
6. Billing, data export/deletion, admin console, monitoring
7. Desktop browser extension for "draft comment"

## Known limitations

- Re-saving settings replaces topic pillars, which unlinks existing wins from their pillar.
- "Sounds like you" stays unknown until the user adds sample posts (voice profile comes later).
- Voice capture uses the browser's speech recognition where available (Chrome, Edge, Safari).
- The Supabase free tier pauses after a week without activity; restore it from the dashboard
  (or upgrade) before beta users arrive.
