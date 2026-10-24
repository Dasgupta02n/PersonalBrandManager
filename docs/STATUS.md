# Build status

## Milestone 1 — foundation and first slice (done)

- Product spec, architecture, schema with row-level security (verified: signup trigger, per-user isolation)
- Sign-in: email only. One email holds a one-time code (type it on any device) and a link that works in
  any browser (`/auth/confirm`); no password and no social sign-in. Sent from hello@c7xai.in.
- Onboarding: name, role, topic pillars, audience, confidentiality rules, voice samples, prompt time
- Today: log a win → AI extracts structured wins, fact-checked against the note (+ optional
  follow-up question) → 3 post ideas when the user asks
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
  comment starters, "Your record", new landing and sign-in pages, logo, light and dark themes
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
  (16 cases, faithful 69%). Not yet past the gate, but switched on by decision because it keeps
  the record faithful; post ideas now come on request, which pays for it.
- Post ideas: 58% with the grounded prompt; the sharper prompt plus fact-checker scored 50%
  (grounded but flat), so ideas keep the grounded prompt.
- First tests of the rest: style notebook 80% (10 cases, just short of the gate; captures 57% of
  known style traits against 19%), profile and CV refresh 40%, comment starters 27% (the single
  prompt is better: ours sometimes gives the user experiences they may not have).
- The harness reuses earlier outputs and gradings, caps every run at the account's credit and
  stops on the first credit refusal.

## Milestone 2 — network and next-role positioning (done, 2026-10-23)

- **Network tab** (`/network`): setup questions (role wanted next, level, functions, sectors,
  countries and cities, current company, competitors, companies the user would join, timeline,
  what they can offer), then the first suggestions: search firms matched by plain rules from a
  directory of 95 firms checked on their own websites (`src/lib/network/firms-data.ts`, research in
  `/home/user/research_notes/Search firm directory data/`), and AI suggestions of companies and job
  titles worth knowing, never names (`network_map`). LinkedIn people searches open only in the
  user's own browser.
- **People** with stages, a conversation log, next steps (due ones also show on Today), roles
  through each contact, and messages written from the record (`outreach_message`), checked for
  confidential details and, except to search consultants, job-hunt phrases. The contact's name
  never goes to the AI. "I've sent it" logs the message and sets a follow-up a week out.
- **Roles** pipeline (heard about, exploring, interviewing, offer, closed). The weekly scorecard
  counts network conversations.
- Migration `0002_network.sql`: five user tables with `own_rows` RLS and grants, and a trigger so
  interactions and roles can only point at the same user's contacts.
- **Positioning:** "Ready for your next role, without looking like you're looking." The public
  site, share image, FAQ, terms (section 7) and privacy notice (version 2026-10-23, so existing
  users consent again) cover the network. New public page: `/search-firms`.
- **Price:** $30 a month, $330 a year, $10 for the first 30 days. After payment fees and an
  income tax reserve, each price splits into three equal parts: cost, performance marketing and
  profit (`docs/PRICING.md`).

## Milestone 2b — names never reach the AI; search by meaning (done, 2026-10-23)

- **Privacy service** (`privacy/`, image `winwall-privacy`): two open models on our own server,
  BERT-NER for names (MIT) and bge-small for search (MIT), baked into the image; private network,
  no internet, read-only, non-root, 1 GB cap (about 0.4 GB used). VPS upgraded to KVM 2.
- **Every AI call** swaps people's names and private terms for placeholders first and restores
  names in what the user sees (`src/lib/privacy`); it fails closed if the service is down. Names
  caught: 47 of 48 on a held-out set of fictional notes, 69 of 69 on the tuning set.
- **Record search** on Wins (meaning and words), **best evidence** for each open role, and the
  most relevant wins for network messages. Migration `0003_record_search.sql` adds `wins.embedding`.
- Privacy notice, security page, how it works, FAQ and the data diagram say so (2026-10-23).

## Maintenance

- 2026-10-24: Next.js 16.4.0 → 16.4.3 (and eslint-config-next), fixing three advisories: remote
  code execution in the image optimiser with SVG (GHSA-2464-fhr4-w9xw), remote code execution in
  `use cache` functions (GHSA-673q-mjm6-r5xr) and a Server Actions denial of service
  (GHSA-p3m5-59mp-jv5r).
- 2026-10-24: nodemailer 7.0.13 → 10.2.1, fixing 17 advisories, among them SMTP command and
  header injection (GHSA-c7w3-x93f-qmm8, GHSA-vvjj-xcjg-gr5g, GHSA-268h-hp4c-crq3), recipient
  domain bypasses and address-parser denial of service. Its breaking changes don't touch our use
  (renamed error codes, certificate checks on remote attachments, Node 20+; we run Node 22).
  It now ships its own types, so `@types/nodemailer` is gone. zod 4.6.5 → 4.6.7, fixing memory
  exhaustion on oversized collections (GHSA-mrhx-c7xc-m3w5). Sign-in checked end to end against
  a local SMTP server. `npm audit` reports no vulnerabilities.
- 2026-10-24: privacy service on transformers.js 3.8.1 → 4.3.1, which brings sharp 0.35.5 and
  clears its three high advisories in bundled image libraries (GHSA-f88m-g3jw-g9cj,
  GHSA-rgj7-g3m4-5g8c, GHSA-wq5f-xc86-pv6w; the service never handles images). Same model files, byte for byte. Name
  finding is unchanged on every test note: 69 of 69 names (tuning), 47 of 48 (held out, missing
  "Madison"), with the same 2 false alarms in 20 name-free notes. Search vectors shift slightly
  with the new ONNX runtime (cosine 0.993 or more against the old ones; same top result on every
  test query). No vectors are stored in production yet; if a runtime upgrade ever lands after
  wins have been embedded, change the embedding tag so they are redone. ONNX runtime files moved
  to `napi-v6`, so the Dockerfile trims that folder. The image loads faster and uses about 0.3 GB
  instead of 0.4 GB. `npm audit` in `privacy/` reports no vulnerabilities.

## Public site

Home, how it works, the search firm directory, pricing, FAQ, security, privacy, terms, refunds, cookies, accessibility,
about, contact (with the grievance officer) and an HTML site map, plus `robots.txt`,
`sitemap.xml`, `llms.txt` and `/.well-known/security.txt`. Every public page is server-rendered;
facts, prices and the page list come from `src/lib/config/site.ts` and
`src/lib/billing/pricing.ts`, so the pages, structured data and llms.txt can't disagree.
Redesigned on 2026-10-22, after research, on one white system shared with the app: Schibsted
Grotesk, near-black ink, an ink-blue accent held in reserve, hairlines, real product screens and a
brick-wall logo (`docs/DESIGN.md`; research and brief in
`/home/user/reports/Upmarket white web app UI design.md`). Research behind it: `/home/user/reports/Winwall website keywords AEO and trust.md` (outside the
repo). Open:
- Founder name, city, legal name and a business address in `OPERATOR` (needed for the grievance
  officer, terms and Paddle before payments open)
- Verify the site in Google Search Console and Bing Webmaster Tools; submit the sitemap
- Move to winwall.app (bought 2026-10-24): `SITE_URL`, contact emails, security.txt, the sign-in
  sender and 301 redirects from c7xai.in are ready on branch `winwall-app-domain`; merge and
  deploy once the domain registration, DNS and mailbox work (`docs/DEPLOY.md`, "Moving to
  winwall.app")
- Guides and free tools from the keyword map (year-end review content first)

## Needed to run end to end

See `docs/DEPLOY.md`. Live at https://c7xai.in since 2026-10-21 as **Winwall**, all on our own
VPS: PostgreSQL 17, our own email sign-in and sessions, internal passwords created on the server,
and nightly encrypted backups (backup and restore tested). Supabase is no longer used (the old
project is kept for now, by decision). Hostinger's weekly VPS snapshots stay on, by decision; they
are stored outside India (most likely Malaysia) and not encrypted by us. Open:
- In Docker Manager, project `pbm`: `SMTP_PASSWORD` (until then nobody can sign in),
  `OPENROUTER_API_KEY` and `BACKUP_PASSPHRASE`
- Google Drive for backups (rclone, `drive.file` scope)
- winwall.app: finish the registration, DNS records and the hello@winwall.app mailbox (with the
  privacy@ alias); then the move above
- Privacy notice: legal entity name and address, and legal review. (`privacy@winwall.app` will be an
  alias delivering to hello@winwall.app.)

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
7. Network: re-check the firm directory each quarter (and the ~20 firms whose sites couldn't be
   read), add more regional firms, and measure suggestion and message quality in `evals/`

## Known limitations

- Re-saving settings replaces topic pillars, which unlinks existing wins from their pillar.
- The firm directory is a snapshot (checked 2026-10-23). Some large recruiters list countries
  without city offices; empty sectors or functions mean "not stated on the site".
- `network_map` and `outreach_message` have no eval sets or baselines yet.
- Name finding misses some names (about 2% on the held-out set), especially names that are also
  everyday words ("Madison", "Joy"); the AI prompt is the second line of defence. Search by
  meaning on bge-small is coarse: it orders results well but sometimes returns nothing for broad
  queries such as "stakeholder management".
- "Sounds like you" stays unknown until the user adds sample posts (voice profile comes later).
- Voice capture uses the browser's speech recognition where available (Chrome, Edge, Safari).
- One small VPS runs the app, the database and two other sites: fine for the beta; move the
  database to its own server (or a bigger plan) before it gets busy.
