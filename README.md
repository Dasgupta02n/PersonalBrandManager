# Personal Brand Manager (working name)

**Nothing you'll regret posting.** A private, facts-first LinkedIn ghostwriter for employed
professionals. Note what moved forward in a minute a day; get post ideas and drafts built only
from your real wins, checked for confidentiality, tone and how they will read before you see
them, plus comment starters, a weekly profile and CV refresh, and a scorecard led by the
opportunities that came to you. The user approves everything — the product never posts,
comments or edits LinkedIn on its own.

- Product requirements: [docs/PRD.md](docs/PRD.md)
- Architecture: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- Design system: [docs/DESIGN.md](docs/DESIGN.md)
- Research behind the design: [docs/research/](docs/research/)
- Build status: [docs/STATUS.md](docs/STATUS.md)

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
