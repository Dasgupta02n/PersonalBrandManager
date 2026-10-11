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
| Payments | Stripe or Paddle; Razorpay for India | Not in the first slice. |
| Monitoring | Sentry, uptime checks, AI usage table | Not in the first slice. |

## Source layout

```
src/
  app/                 Routes (pages, layouts, route handlers, server actions)
  lib/
    config/            Environment parsing, app constants
    supabase/          Server and browser clients, proxy session refresh
    ai/                AI client (OpenRouter), model per function, prompts, AI tasks
    guardrails/        Deterministic checks (confidentiality, clichés, job-search signals)
    schedule/          Time-zone prompt windows, streaks
    domain/            Shared types
supabase/
  migrations/          SQL migrations (schema + RLS)
docs/                  PRD, architecture, decisions
```

## Data model

| Table | Purpose |
|---|---|
| `profiles` | One row per user: name, time zone, language, prompt time and channel, audience, onboarding state |
| `voice_profiles` | Writing-style summary, traits, sample posts |
| `pillars` | 3–5 topics the user wants to be known for |
| `confidentiality_rules` | Employer-name policy, never-mention list, number policy |
| `journal_entries` | Raw daily entries, verbatim, with source channel |
| `wins` | Structured wins extracted from entries (summary, impact, metric, skills, pillar) |
| `drafts` | Post ideas, post drafts, comment and reply drafts, with guardrail results and status |
| `opportunities` | Things that came to the user (headhunters, invitations, meetings) |
| `profile_suggestions` | Weekly proposed changes to LinkedIn sections, with approval status |
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
| `extract_wins` | live | Claude Opus 5.5 | low | Wins: summary, impact, metric, skills, pillar, confidentiality flag; follow-up question |
| `post_ideas` | live | Claude Opus 5.5 | medium | 2–3 ideas: angle, hook, source win ids |
| `draft_post` | live | Claude Opus 5.5 | high | Hook, body, closing question, hashtags |
| `check_draft` | live | Claude Opus 5.5 | high | Pass/fail per check, problems, revised text |
| `draft_comments` | live | Claude Opus 5.5 | medium | 2–3 comment options |
| `draft_reply` | planned | Claude Opus 5.5 | medium | Reply options for comments on the user's posts |
| `read_post_screenshot` | planned | Claude Opus 5.5 | low | Post text and author from a screenshot |
| `import_profile` | planned | Claude Opus 5.5 | medium | Positions, skills, past posts from a LinkedIn PDF or export |
| `import_cv` | planned | Claude Opus 5.5 | medium | Facts from an uploaded CV |
| `voice_profile` | planned | Claude Opus 5.5 | high | Writing-style summary and traits |
| `profile_suggestions` | planned | Claude Opus 5.5 | high | Proposed headline, About, experience, skills, featured |
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

1. Deterministic checks (`src/lib/guardrails`): never-mention terms, employer-name policy,
   job-search phrases, clichés, length.
2. AI check (`check_draft`): factual grounding against the user's wins, profile and CV;
   confidentiality judgement; returns a revised draft when fixable.
3. Drafts that still fail are stored with status `draft` and a visible warning; they are never
   shown as ready to post.

## Security

- RLS on every user table; the service role key is only used server-side in cron and webhooks.
- Every server action and route handler verifies the session before touching data.
- No LinkedIn credentials, cookies or automation anywhere in the system.
