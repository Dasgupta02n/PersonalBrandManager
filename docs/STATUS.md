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

## Milestone 1c — pricing, positioning and retention (done)

- One global price: $29 a month, $319 a year, first month $9.50. Split 30% input, 30% marketing,
  30% profit after income tax (`docs/PRICING.md`); tests fail if a plan breaks it
- Plans table and a monthly AI allowance per plan, checked before every AI action against the
  real cost of each call; notes are always saved
- Landing page leads with the check and the private record; comparison with a general AI
  assistant; pricing section; public header and footer; launch is global
- Your record: This week (opportunities log and scorecard), Profile & CV refresh
  (`profile_suggestions` is live), Export (appraisal summary and year in wins)
- Free post check at `/check`, in the browser only
- Regulated-firm mode: promissory and performance language blocked, approval reminder;
  "not yet public" phrases noted; "a careful second read, not clearance" on every draft
- Privacy: consent with version, keep names out (default on), download everything, account
  deletion, privacy notice with sub-processors and Mumbai hosting, breach runbook
  (`docs/PRIVACY.md`)
- Private style notebook ("How you write"): learns from edits before posting, dismissed ideas,
  revisions and sample posts (`voice_profile` is live); visible, editable and clearable; used
  by every draft. Consent wording now says "never used to train AI models", and consent is
  asked again whenever the notice version changes
- Fix: new ideas now replace the ones still waiting, so Today shows ideas from today's win
- Checks: lint, typecheck, 101 unit tests, production build

## Milestone 1d — quality bar, step 1 (done)

- Harness in `evals/`:
  - a single-prompt baseline per function (same model, same facts, rules and samples);
  - a blind pairwise grader run in both orders;
  - plain-code metrics, including the safety check's catch rate and false alarms;
  - pass rules, reports with real costs, and a blind review page for experts.
- Synthetic test sets with 12 fictional personas (India, UK, US, UAE, Singapore; three in
  regulated finance), all validated:
  - 200 daily notes and 300 draft ideas;
  - 100 risky plus 40 clean posts;
  - 60 idea records and 60 labelled "how it reads" posts;
  - 60 revisions and 60 comment cases;
  - 24 profile records and 24 edit histories.
- `npm run eval` runs it for real: about $43 for 40 cases per function, about $122 for
  everything. `npm test` includes a free dry run of all nine functions.
- Not yet run against the real model: it needs `OPENROUTER_API_KEY` in the environment.
- Checks: lint, typecheck, 157 unit tests, production build.

## Milestone 1e — quality bar, first runs (done)

Real runs on 20 October, about $47 in total. Reports in `evals/reports/`; the summary across
every feature is `evals/reports/2026-10-20-holistic.md`.
- Safety check: passes. It catches every risk in the sample (46 risky posts) with no false alarm
  that would stop or rewrite a clean post, once the clean posts' story details were recorded.
- Drafts: pass with three drafts and an editor's pick: 86% against the single-prompt baseline
  (60%–96%, 14 cases), up from 57% at the first run; now on in the product. Usefulness to the
  reader is still the weakest criterion.
- Wins from notes: 48% after rebalancing the prompt (from 13%); 63% with the fact-checker
  (16 cases, faithful 69%), still below the gate, so it stays off for now.
- Post ideas: 58% with the grounded prompt; the sharper prompt plus fact-checker scored 50%
  (grounded but flat), so ideas keep the grounded prompt.
- First tests of the rest: style notebook 80% (10 cases, just short of the gate; captures 57% of
  known style traits against 19%), profile and CV refresh 40%, comment starters 27% (the single
  prompt is better: ours sometimes gives the user experiences they may not have).
- The harness reuses earlier outputs and gradings, caps every run at the account's credit and
  stops on the first credit refusal.

## Needed to run end to end

See `docs/DEPLOY.md`. Done: Supabase project in Mumbai with the schema applied and checked
(security advisor clean apart from the intentional service-role-only `ai_usage`); VPS firewall.
Open:
- Supabase auth URL configuration (Site URL and redirect URL)
- Image access on the VPS (public GHCR package, or a one-time `docker login ghcr.io`); the `edge` update is done
- `pbm` project on the VPS, with `OPENROUTER_API_KEY` added in Docker Manager
- Custom SMTP for sign-in emails before inviting beta users
- `SUPABASE_SECRET_KEY` on the server: allowance checks and account deletion need it
- Privacy notice: legal entity name and address, legal review, a working `privacy@c7xai.in`

## Next milestones

1. Quality bar. Step 1 built: synthetic test sets for all nine functions, a single-prompt
   baseline per function, a blind grader, metrics, reports and a human review kit (`evals/`).
   Drafts and the safety check pass. Next: get wins from notes and post ideas over the gate
   (ideas need sharper angles that stay grounded), confirm drafts on more cases, expert review of
   a sample of the test sets and of the blind review page, then story arcs and expert examples
2. Daily prompt delivery (email first, then WhatsApp and web push) via `/api/cron/tick`
3. Voice profile generation from samples / LinkedIn export import; CV upload
4. CV documents (DOCX/PDF) and versions; weekly profile prompt
5. Scorecard: profile strength, reach from screenshot
6. Billing (Paddle), renewal emails with the year in wins, admin console, monitoring
7. Desktop browser extension for "draft comment"

## Known limitations

- Re-saving settings replaces topic pillars, which unlinks existing wins from their pillar.
- "Sounds like you" stays unknown until the user adds sample posts (voice profile comes later).
- Voice capture uses the browser's speech recognition where available (Chrome, Edge, Safari).
- The Supabase free tier pauses after a week without activity; restore it from the dashboard
  (or upgrade) before beta users arrive.
