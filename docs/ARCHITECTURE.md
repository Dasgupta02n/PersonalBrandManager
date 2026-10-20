# Architecture — Personal Brand Manager (Beta)

## Stack

| Layer | Choice | Notes |
|---|---|---|
| Web app | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4 | Mobile-first, installable PWA. `proxy.ts` replaces `middleware.ts` in Next 16. Cache Components is off: app pages are per-user and rendered on request. |
| Auth | Supabase Auth | Email magic link, Google, Microsoft, LinkedIn (OIDC, sign-in only). |
| Database | Supabase Postgres with row-level security | Every user-owned table has `user_id` and RLS `user_id = auth.uid()`. |
| File storage | Supabase Storage (private buckets) | CV versions, uploaded exports, screenshots. |
| AI | Claude models via OpenRouter (Anthropic-compatible API, `@anthropic-ai/sdk`) | One pinned model per function, structured outputs, zero-data-retention hosts only. |
| Scheduling | `/api/cron/tick` every 15 minutes (Supabase `pg_cron` + `pg_net`, or any external cron) | Finds users whose local prompt time falls in the window; enqueues work. |
| Messaging | WhatsApp Business Platform (Meta Cloud API), email (inbound + outbound), web push | Channel adapters behind one interface. |
| Payments | Paddle as merchant of record | Not built yet. Plans and allowances are; see `docs/PRICING.md`. |
| Monitoring | Sentry, uptime checks, AI usage table | Not in the first slice. |

## Source layout

```
src/
  app/                 Routes (pages, layouts, route handlers, server actions)
  lib/
    config/            Environment parsing, app constants
    supabase/          Server and browser clients, proxy session refresh
    ai/                AI client (OpenRouter), model per function, prompts, AI tasks
    billing/           Global price and split, plan allowances, allowance check
    guardrails/        Deterministic checks (confidentiality, clichés, job-search signals), tiers
    content/           LinkedIn preview rules, UI labels, verdict and check tiers, record exports and scorecard
    schedule/          Time-zone prompt windows, forgiving workday consistency
    domain/            Shared types
  components/          UI primitives (ui.tsx), client widgets, brand mark, navigation
supabase/
  migrations/          SQL migrations (schema, RLS, grants)
docs/                  PRD, architecture, design system, research
evals/                 Quality bar: synthetic test sets, single-prompt baselines, blind grader, runner
```

## Data model

| Table | Purpose |
|---|---|
| `profiles` | One row per user: name, role, tone (`reserved` / `balanced` / `open`), routine cue, time zone, language, prompt time and channel, audience, onboarding state, privacy consent (time and notice version) |
| `subscriptions` | Plan (`beta` / `trial` / `member`), start, billing fields. Users can read their own row; only trusted server code writes it |
| `voice_profiles` | The private style notebook: voice summary, sample posts, learned and user-added notes, removed notes, edit counts |
| `pillars` | 3–5 topics the user wants to be known for |
| `confidentiality_rules` | Employer-name policy, never-mention list, number policy, no-go topics, regulated-firm mode, keep names out |
| `journal_entries` | Daily entries as written, or with names replaced by roles when "keep names out" is on |
| `wins` | Structured wins extracted from entries (summary, impact, metric, kind, skills, pillar) |
| `drafts` | Post ideas, post drafts, comment and reply drafts, with format, guardrail and "how it reads" results, status, and the last AI-written version (to learn from the user's edits) |
| `opportunities` | Things that came to the user (headhunters, invitations, meetings) |
| `profile_suggestions` | Proposed headline, About, current-role bullets, CV bullets and skills, with the user's pasted current text and status |
| `cv_versions` | Generated CV files (storage path), version number, change summary |
| `reach_snapshots` | Reach numbers read from screenshots (or API later) |
| `scorecards` | Weekly scorecard snapshots |
| `watch_list` | People the user wants to engage with |
| `ai_usage` | Model, host, tokens and cost of every AI call, per user (service role only) |

## AI tasks

All calls go through `src/lib/ai/client.ts`, which uses the Anthropic SDK pointed at OpenRouter's
Anthropic-compatible API (`https://openrouter.ai/api`, key in `OPENROUTER_API_KEY`).

Every function, live or planned, has its model and effort set in `src/lib/ai/models.ts`. Each is
pinned to one model: OpenRouter never swaps in another model and no model fallbacks are sent.
Override a function's model with `AI_MODEL_<TASK>` (an OpenRouter id, for example
`AI_MODEL_EXTRACT_WINS=anthropic/claude-haiku-5.5`).

| Function | Status | Model | Effort | Output (structured) |
|---|---|---|---|---|
| `extract_wins` | live | Claude Opus 5.5 | low | Wins: summary, impact, metric, kind, skills, pillar, confidentiality flag; follow-up question; the note with names replaced by roles |
| `verify_wins` | built, off | Claude Opus 5.5 | medium | Each win's summary and impact with anything the note doesn't support removed |
| `post_ideas` | live | Claude Opus 5.5 | medium | 2–3 ideas, best first: format, angle, hook, source win ids |
| `verify_ideas` | built, off | Claude Opus 5.5 | medium | Each idea's angle and first line with unsupported details and links removed |
| `draft_post` | live | Claude Opus 5.5 | high | Hook, body, closing question, 0–3 hashtags; three drafts per idea with different leanings |
| `select_draft` | live | Claude Opus 5.5 | high | Which of the three drafts the user sees, after ruling out unsupported or unsafe ones |
| `check_draft` | live | Claude Opus 5.5 | high | Grounding, confidentiality, job-search signal, no-go topics, hierarchy risk, revised text |
| `how_it_reads` | live | Claude Opus 5.5 | high | Verdict (confident / boastful / too modest / generic), sounds like the user, per-reader notes, lines to change |
| `revise_draft` | live | Claude Opus 5.5 | medium | Shorter, more modest, or stronger first line |
| `comment_starters` | live | Claude Opus 5.5 | medium | 2–3 approaches: opening line and what to add |
| `draft_reply` | planned | Claude Opus 5.5 | medium | Reply options for comments on the user's posts |
| `read_post_screenshot` | planned | Claude Opus 5.5 | low | Post text and author from a screenshot |
| `import_profile` | planned | Claude Opus 5.5 | medium | Positions, skills, past posts from a LinkedIn PDF or export |
| `import_cv` | planned | Claude Opus 5.5 | medium | Facts from an uploaded CV |
| `voice_profile` | live | Claude Opus 5.5 | high | Voice summary and up to 8 style observations from samples and edited posts |
| `profile_suggestions` | live | Claude Opus 5.5 | high | Headline, About, current-role bullets, CV bullets, skills, each with a reason |
| `cv_update` | planned | Claude Opus 5.5 | high | New CV content and change summary |
| `read_reach_screenshot` | planned | Claude Opus 5.5 | low | Reach numbers from an analytics screenshot |
| `weekly_summary` | planned | Claude Opus 5.5 | medium | Sunday summary for the scorecard |

Voice-note transcription (daily capture) needs a speech-to-text model; it is chosen when that
feature is built.

Request defaults: structured outputs (`output_config.format` from the Zod schema), explicit
`effort`, a cached system prompt, and `provider: { zdr: true, require_parameters: true }` so
OpenRouter only uses hosts with zero data retention that support structured outputs (today:
Google Vertex). The stop reason is checked before parsing (`refusal`, `max_tokens`). Every call
records the serving model, host, tokens and cost in `ai_usage`.

## Guardrails pipeline

Draft pipeline (`draftPost` in `src/lib/ai/tasks.ts`): draft → review → how it reads.

1. Deterministic checks (`src/lib/guardrails`): never-mention terms, employer-name policy,
   number policy, job-search phrases, clichés, humblebrags, AI-sounding phrases, the
   "it's not X, it's Y" construction, bait closers, hashtag count, length. Run on normalised text.
2. AI check (`check_draft`): factual grounding against the user's wins, profile and CV;
   confidentiality and no-go topics; outshining a boss or client; returns a revised draft when
   fixable. The safer version is offered alongside the original.
3. How it reads (`how_it_reads`): only quotes found verbatim in the draft are kept; "sounds like
   you" is unknown until the user adds sample posts.
4. Every issue has a tier (`issueTier`): 1 blocks copying until fixed or acknowledged, 2 is a
   visible note, 3 is a quiet suggestion (`src/lib/content/verdict.ts`). Drafts with tier-1
   problems are stored with status `draft` and never shown as ready to post. Edits mark the
   AI review as stale until re-checked.

## Plans and allowance

One global price (`src/lib/billing/pricing.ts`, explained in `docs/PRICING.md`): 30% input cost,
30% marketing, 30% profit after income tax. Each plan's monthly AI allowance is derived from it.
`requireAllowance` runs before every AI action and sums the real cost of the period's calls from
`ai_usage` (OpenRouter's reported cost, or tokens × list price). When the allowance is used, the
note is still saved and the AI step is skipped with a calm message.

## Style notebook

`src/lib/voice/`: how each user writes, kept in their own `voice_profiles` row.

- **Plain code learns from behaviour:** when a draft is marked posted, the AI's last version is
  compared with what the user posted. That gives words removed or added, "I" moving to "we",
  emojis, hashtags and exclamation marks removed, and length. Dismissed ideas count by format,
  and one-tap revisions by mode. A pattern becomes a note once seen in two drafts.
- **The AI learns from writing:** `voice_profile` reads the sample posts and the last five edited
  posts, and writes up to 8 style observations. It runs when samples change, after every three
  edited posts (in `after()`, so nobody waits), or on request. It uses the plan's allowance.
  Observations that mention a never-mention term or the employer are dropped.
- **The user controls it:** `/style` shows every note with its source. The user can remove any
  (removed ones never come back), add their own, or clear what was learned.
- **Every draft follows it:** the notebook goes into the user context for every AI step, and
  words the user removes become a quiet tier-3 check.

## Privacy

- Consent to the privacy notice is recorded at setup; accounts without it see `/consent` once.
- "Keep names out" (default on): never-mention terms are masked before a note is stored, and the
  stored note is replaced by the AI's version with people referred to by role.
- `/account/export` returns everything the user stored as JSON (row-level security applies);
  account deletion uses the service role and cascades to every user table. `ai_usage` keeps cost
  rows without the user id.
- The free checker at `/check` runs the deterministic checks in the browser only.
- Breach handling and data map: `docs/PRIVACY.md`.

## Quality bar

`evals/` measures every AI function against the strongest single prompt on the same model:
- synthetic test sets with fictional personas (`evals/data/`, validated by `evals/data.test.ts`);
- a baseline per function (`evals/lib/baselines.ts`);
- a blind pairwise grader run in both orders (`evals/lib/judge.ts`);
- plain-code metrics, including the safety check's catch rate and false alarms;
- a report with pass or fail per function, and a blind review page for human experts.

Extra pipeline steps are switched on in `QUALITY_STEPS` (`src/lib/ai/models.ts`) only once the
quality bar shows they beat the baseline and their cost fits the plan allowance. Three drafts with
an editor's pick are on; the fact-checkers for wins and ideas are built and off: they improved
faithfulness but have not yet beaten the baseline.

`npm run eval` runs it with real model calls. `npm test` includes a free dry run that keeps the
harness working. Baselines and the grader call the model through `runWithModel` in
`src/lib/ai/client.ts`.

## Design system

Tokens, type, layout and copy rules are in `docs/DESIGN.md`; tokens live in
`src/app/globals.css` and primitives in `src/components/ui.tsx`.

## Security

- RLS on every user table; the service role key is only used server-side in cron and webhooks.
- Explicit, least-privilege Data API grants on every table: signed-in users reach their own rows
  (read-only for `subscriptions`, nothing for `ai_usage`), the service role reaches everything, and
  `anon` reaches nothing. New tables start with no access; each migration grants its own tables.
- Every server action and route handler verifies the session before touching data.
- No LinkedIn credentials, cookies or automation anywhere in the system.
