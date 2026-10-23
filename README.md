# Winwall

**Ready for your next role, without looking like you're looking.** A private career tool for
senior employed professionals. Note what moved forward in a minute a day. Every LinkedIn draft is
checked for what your employer, clients and peers will see before you see it. Posts, comment
starters, profile and CV updates and appraisal summaries are built only from your record. The
Network finds the executive search firms that place people like you and the roles worth knowing at
your competitors, and keeps every conversation and follow-up in one private place. The user
approves and sends everything; the product never posts, messages or touches LinkedIn on its own.

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
