# Deployment — Hostinger VPS + c7xai.in

## Topology

```
Internet ──HTTPS──> edge-caddy (project "edge", ports 80/443)
                      ├── hanumat.life ──> hanumat (nginx, unchanged)
                      └── c7xai.in     ──> pbm-app:3000 (project "pbm", network "web")
pbm-app ──> Supabase (managed Postgres + Auth), OpenRouter (Claude models)
```

- VPS: Hostinger KVM 1 (id 1835400), Ubuntu 24.04 with Docker, Mumbai.
- DNS: `c7xai.in` and `www.c7xai.in` A records already point to the VPS (187.127.156.152).
  Caddy obtains HTTPS certificates automatically. `www` redirects to the apex.
- Images are built by GitHub Actions on every push to `main` and published to
  `ghcr.io/dasgupta02n/personalbrandmanager` (`latest` and the commit SHA).

## One-time setup

1. **Supabase (done):** project `personalbrandmanager` (ref `xvjlpqkfhtyzbceyvpkc`, ap-south-1,
   free plan), URL `https://xvjlpqkfhtyzbceyvpkc.supabase.co`. All of `supabase/migrations/` is
   applied. Sign-in is email only (a one-time code and a link in one email). Still to do in the
   dashboard, under Authentication:
   - **URL Configuration:** Site URL `https://c7xai.in`; Redirect URLs `https://c7xai.in/**`.
   - **Emails → SMTP Settings** (Supabase's own sender only reaches members of the Supabase team):
     enable custom SMTP; sender email `hello@c7xai.in`; sender name `c7xai`; host
     `smtp.hostinger.com`; port `465`; username `hello@c7xai.in`; password: the mailbox password,
     typed there and nowhere else. The domain's SPF, DKIM and DMARC records already cover
     Hostinger mail.
   - **Emails → Templates:** for both "Magic link" and "Confirm sign up", subject
     `Your sign-in code` and the body in `supabase/templates/sign-in.html`. Its link goes to
     `/auth/confirm`, which works in any browser; the code works on any device.
   - **Rate Limits:** emails per hour, raise from the default to about 100 for the beta. Hostinger
     mailboxes also have a daily sending limit; check it in hPanel before larger invites.
   - **Sign In / Providers:** Email on; Google, Azure and LinkedIn stay off. Email OTP length 6.
2. **Image access on the VPS:** either make the GHCR package public, or run once in the hPanel
   browser terminal: `docker login ghcr.io -u <github-username>` with a token that has only
   `read:packages`.
3. **Edge project:** update project `edge` with `deploy/edge.compose.yml` (adds the `web` network
   and the c7xai.in site). The `hanumat` service is unchanged. Hostinger's API rejects this file
   sent inline (403, most likely because of the shell commands in the `hanumat` service), so pass
   it as a commit-pinned raw GitHub URL (needs the repo public) or paste it in hPanel → Docker
   Manager. Done on 2026-10-11 from commit `bd10d4b`. Any recreate of the `hanumat` container
   re-downloads about 3 GB of site archives: hanumat.life returned 502 for about 7 minutes.
4. **App project:** create project `pbm` from `deploy/app.compose.yml` and set its environment
   variables in Docker Manager (never commit them):
   `APP_URL=https://c7xai.in`, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`,
   `OPENROUTER_API_KEY`, `CRON_SECRET`. Empty values count as unset, so the app starts without
   the optional ones (AI features need `OPENROUTER_API_KEY`). Give the OpenRouter key a credit
   limit in OpenRouter's key settings.

## Releasing

Push to `main` → CI checks and publishes the image → update project `pbm` in Docker Manager
(pulls `latest` and recreates the container). Roll back by pinning the image to a previous
commit SHA tag.

## Checks after a deploy

- `https://c7xai.in/api/health` returns `{"status":"ok"}`
- `https://hanumat.life` still returns 200
