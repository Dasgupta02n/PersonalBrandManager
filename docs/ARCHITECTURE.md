# Architecture — Personal Brand Manager (Beta)

## Stack

| Layer | Choice | Notes |
|---|---|---|
| Web app | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4 | Mobile-first, installable PWA. `proxy.ts` replaces `middleware.ts` in Next 16. |
| Auth | Supabase Auth | Email magic link, Google, Microsoft, LinkedIn (OIDC, sign-in only). |
| Database | Supabase Postgres with row-level security | Every user-owned table has `user_id` and RLS `user_id = auth.uid()`. |
| File storage | Supabase Storage (private buckets) | CV versions, uploaded exports, screenshots. |
| AI | Claude API via `@anthropic-ai/sdk` | Task-based model config, structured outputs, server-side refusal fallback. |
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
    ai/                Claude client, task/model config, prompts, AI tasks
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
| `ai_usage` | Tokens per task per user, for cost tracking (service role only) |

## AI tasks

All calls go through `src/lib/ai/client.ts`. Each task has a model setting; every task defaults to
`claude-opus-5-5` and can be overridden per task with `AI_MODEL_<TASK>` (for example
`AI_MODEL_EXTRACT_WINS=claude-haiku-5-5`) to trade quality for cost.

| Task | Input | Output (structured) |
|---|---|---|
| `extract_wins` | Journal text, pillars | Wins: summary, impact, metric, skills, pillar, confidentiality flags, follow-up question |
| `post_ideas` | Recent wins, pillars, voice, optional news | 2–3 ideas: angle, hook, source win ids |
| `draft_post` | Idea, source wins, voice, confidentiality rules | Hook, body, closing question, hashtags |
| `check_draft` | Draft, allowed facts, confidentiality rules | Pass/fail per check, problems, revised text |
| `draft_comments` | Post text, voice, pillars | 2–3 comment options |

Request defaults: structured outputs via `betaZodOutputFormat`, adaptive thinking (model default),
explicit `effort`, server-side refusal fallback (`fallbacks: "default"`), and `refusal` stop reason
handling. Every call records token usage in `ai_usage`.

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
