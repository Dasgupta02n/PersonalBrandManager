@AGENTS.md

# Winwall

Personal brand manager for busy professionals: log wins daily, get LinkedIn post/comment drafts,
weekly profile and CV refresh, weekly scorecard. The product name lives in `APP_NAME`
(`src/lib/config/app.ts`).

Read before working:
- `docs/PRD.md` — beta scope and product principles (approval for everything, no LinkedIn
  automation or scraping, real facts only, discreet, confidential).
- `docs/ARCHITECTURE.md` — stack, data model, AI tasks, guardrails.

## Commands

- `npm run dev` — local dev server
- `npm run build` — production build
- `npm run lint` — ESLint
- `npm run typecheck` — TypeScript
- `npm test` — unit tests (Vitest)

## Conventions

- Next.js 16: `proxy.ts` (not `middleware.ts`); `cookies()`, `headers()`, `params` and
  `searchParams` are async. Check `node_modules/next/dist/docs/` before using an unfamiliar API.
- Our own PostgreSQL (no Supabase). Database changes go in a new file `db/migrations/NNNN_name.sql`
  (applied by `npm run db:migrate`). Every user-owned table gets RLS with the `own_rows` policy
  (`user_id = app_user_id()`) and explicit grants in the same migration: `select, insert, update,
  delete` to `pbm_user` and `pbm_service`. See `db/migrations/0001_schema.sql`.
- Queries go through `src/lib/db/client.ts`: `userDb(userId)` for a signed-in user's data (RLS
  applies), `serviceDb()` / `asService()` only for trusted server code. Never query as the bare login.
- Sign-in and sessions are ours (`src/lib/auth`); never store codes, links or tokens unhashed.
- AI calls go through `src/lib/ai/client.ts`; never call the SDK directly from routes.
- Never add code that logs in to, scrapes or automates LinkedIn.
