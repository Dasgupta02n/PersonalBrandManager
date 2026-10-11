# Personal Brand Manager (working name)

A personal brand manager for busy professionals. Log what you did in a minute a day; get LinkedIn
post and comment drafts in your voice, a weekly profile and CV refresh, and a weekly brand
scorecard led by the opportunities that came to you. The user approves everything — the product
never posts, comments or edits LinkedIn on its own.

- Product requirements: [docs/PRD.md](docs/PRD.md)
- Architecture: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)

## Local setup

```bash
cp .env.example .env.local   # fill in Supabase and OpenRouter keys
npm install
npm run dev
```

Apply the database schema from `supabase/migrations/` to your Supabase project. Deployment: [docs/DEPLOY.md](docs/DEPLOY.md).

## Checks

```bash
npm run lint
npm run typecheck
npm test
npm run build
```
