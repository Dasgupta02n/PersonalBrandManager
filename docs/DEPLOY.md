# Deployment — Hostinger VPS + c7xai.in

## Topology

```
Internet ──HTTPS──> edge-caddy (project "edge", ports 80/443)
                      ├── hanumat.life ──> hanumat (nginx, unchanged)
                      └── c7xai.in     ──> pbm-app:3000 (project "pbm", network "web")
pbm-app ──> Supabase (managed Postgres + Auth), Claude API
```

- VPS: Hostinger KVM 1 (id 1835400), Ubuntu 24.04 with Docker, Mumbai.
- DNS: `c7xai.in` and `www.c7xai.in` A records already point to the VPS (187.127.156.152).
  Caddy obtains HTTPS certificates automatically. `www` redirects to the apex.
- Images are built by GitHub Actions on every push to `main` and published to
  `ghcr.io/dasgupta02n/personalbrandmanager` (`latest` and the commit SHA).

## One-time setup

1. **Supabase:** create a project (region: Mumbai / ap-south-1), apply `supabase/migrations/`, then in
   Authentication → URL configuration set Site URL `https://c7xai.in` and add redirect URL
   `https://c7xai.in/auth/callback`. Enable the Google, Azure (Microsoft) and LinkedIn (OIDC)
   providers when ready.
2. **Image access on the VPS:** either make the GHCR package public, or run once in the hPanel
   browser terminal: `docker login ghcr.io -u <github-username>` with a token that has only
   `read:packages`.
3. **Edge project:** update project `edge` with `deploy/edge.compose.yml` (adds the `web` network
   and the c7xai.in site). The `hanumat` service is unchanged.
4. **App project:** create project `pbm` from `deploy/app.compose.yml` and set its environment
   variables in Docker Manager (never commit them):
   `APP_URL=https://c7xai.in`, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`,
   `ANTHROPIC_API_KEY`, `CRON_SECRET`.

## Releasing

Push to `main` → CI checks and publishes the image → update project `pbm` in Docker Manager
(pulls `latest` and recreates the container). Roll back by pinning the image to a previous
commit SHA tag.

## Checks after a deploy

- `https://c7xai.in/api/health` returns `{"status":"ok"}`
- `https://hanumat.life` still returns 200
