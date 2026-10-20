@AGENTS.md

# Personal Brand Manager

Personal brand manager for busy professionals: log wins daily, get LinkedIn post/comment drafts,
weekly profile and CV refresh, weekly scorecard. Working name; the product name lives in
`APP_NAME` (`src/lib/config/app.ts`).

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
- Database changes go in a new file under `supabase/migrations/`; every user-owned table gets RLS.
  Every new table also needs explicit grants in the same migration (Supabase no longer grants new
  tables to the API roles): usually `select, insert, update, delete` to `authenticated` and
  `service_role`, nothing to `anon`. See `20261020000000_explicit_api_grants.sql`.
- AI calls go through `src/lib/ai/client.ts`; never call the SDK directly from routes.
- Never add code that logs in to, scrapes or automates LinkedIn.
