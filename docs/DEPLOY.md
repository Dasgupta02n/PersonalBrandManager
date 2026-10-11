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

1. **Supabase (done):** project `personalbrandmanager` (ref `xvjlpqkfhtyzbceyvpkc`, ap-south-1,
   free plan), URL `https://xvjlpqkfhtyzbceyvpkc.supabase.co`. All of `supabase/migrations/` is
   applied. Still to do in the dashboard: Authentication → URL configuration, set Site URL
   `https://c7xai.in` and add redirect URL `https://c7xai.in/auth/callback`. Enable the Google,
   Azure (Microsoft) and LinkedIn (OIDC) providers when ready. Supabase's built-in email sender
   only delivers to members of the Supabase team, so set up custom SMTP before inviting beta users.
2. **Image access on the VPS:** either make the GHCR package public, or run once in the hPanel
   browser terminal: `docker login ghcr.io -u <github-username>` with a token that has only
   `read:packages`.
3. **Edge project:** update project `edge` with `deploy/edge.compose.yml` (adds the `web` network
   and the c7xai.in site). The `hanumat` service is unchanged. Do this in hPanel → Docker Manager
   by pasting the file: Hostinger's API rejects this file (403), most likely because of the shell
   commands in the `hanumat` service.
4. **App project:** create project `pbm` from `deploy/app.compose.yml` and set its environment
   variables in Docker Manager (never commit them):
   `APP_URL=https://c7xai.in`, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`,
   `ANTHROPIC_API_KEY`, `CRON_SECRET`. Empty values count as unset, so the app starts without
   the optional ones (AI features need `ANTHROPIC_API_KEY`).

## Releasing

Push to `main` → CI checks and publishes the image → update project `pbm` in Docker Manager
(pulls `latest` and recreates the container). Roll back by pinning the image to a previous
commit SHA tag.

## Checks after a deploy

- `https://c7xai.in/api/health` returns `{"status":"ok"}`
- `https://hanumat.life` still returns 200
