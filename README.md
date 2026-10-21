# Winwall

**Nothing you'll regret posting.** A pre-post check and a private record of real work for
employed professionals on LinkedIn. Note what moved forward in a minute a day. Every draft is
checked for what your employer, clients and peers will see before you see it. Posts, comment
starters, profile and CV updates and appraisal summaries are built only from your record. The
user approves everything; the product never posts, comments or edits LinkedIn on its own.

- Product requirements: [docs/PRD.md](docs/PRD.md)
- Architecture: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- Design system: [docs/DESIGN.md](docs/DESIGN.md)
- Pricing: [docs/PRICING.md](docs/PRICING.md)
- Privacy data map and breach runbook: [docs/PRIVACY.md](docs/PRIVACY.md)
- Research behind the design: [docs/research/](docs/research/)
- Build status: [docs/STATUS.md](docs/STATUS.md)

## Local setup

```bash
cp .env.example .env.local   # database URL, AUTH_SECRET, OpenRouter key
npm install
npm run db:migrate           # needs a local PostgreSQL 16 or 17
npm run dev
```

Without a mailbox password, sign-in codes are printed in the server log. Details and
deployment: [docs/DEPLOY.md](docs/DEPLOY.md).

## Checks

```bash
npm run lint
npm run typecheck
npm test
npm run build
```
