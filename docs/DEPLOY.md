# Deployment — Hostinger VPS + c7xai.in

## Topology

```
Internet ──HTTPS──> edge-caddy (project "edge", ports 80/443)
                      ├── hanumat.life ──> hanumat (nginx, unchanged)
                      └── c7xai.in     ──> pbm-app:3000 (project "pbm", network "web")

Project "pbm" (deploy/app.compose.yml):
  pbm-app ──> pbm-db (PostgreSQL 17, private "data" network: no published port, no internet)
          ──> OpenRouter (Claude models), smtp.hostinger.com (sign-in emails)
  pbm-migrate  runs once per deploy: applies db/migrations, sets the app login's password
  pbm-backup   nightly encrypted pg_dump: 14 days on the server, 30 days on Google Drive
```

Everything runs on our own server; the only outside services are OpenRouter (AI), Hostinger's
mail servers (sign-in emails) and Google Drive (encrypted backup copies).

- VPS: Hostinger KVM 1 (id 1835400), Ubuntu 24.04 with Docker, Mumbai. 1 vCPU, 4 GB RAM, 50 GB.
- DNS: `c7xai.in` and `www.c7xai.in` A records point to the VPS (187.127.156.152). Caddy obtains
  HTTPS certificates automatically. `www` redirects to the apex. SPF, DKIM and DMARC cover
  Hostinger mail.
- Images are built by GitHub Actions on every push to `main` and published to
  `ghcr.io/dasgupta02n/personalbrandmanager` and `ghcr.io/dasgupta02n/personalbrandmanager-backup`
  (`latest` and the commit SHA).

## Database access model

The app logs in as `pbm_app`, which has no privileges of its own. Every query runs in a short
transaction that first switches to `pbm_user` (row-level security: a user's queries only see
their own rows) or `pbm_service` (trusted server code: sign-in, sessions, usage, account
deletion). A query that forgets to switch gets nothing. See `db/migrations/0001_schema.sql` and
`src/lib/db/client.ts`.

## One-time setup

1. **Image access on the VPS:** either make both GHCR packages public, or run once in the hPanel
   browser terminal: `docker login ghcr.io -u <github-username>` with a token that has only
   `read:packages`.
2. **Edge project:** done on 2026-10-11 from commit `bd10d4b` (adds the `web` network and the
   c7xai.in site). Hostinger's API rejects `deploy/edge.compose.yml` sent inline (403, most likely
   because of the shell commands in the `hanumat` service), so pass it as a commit-pinned raw
   GitHub URL or paste it in hPanel → Docker Manager. Any recreate of the `hanumat` container
   re-downloads about 3 GB of site archives: hanumat.life returned 502 for about 7 minutes.
3. **Secrets.** In the hPanel browser terminal, run this once; it prints the five random values:

   ```sh
   for n in POSTGRES_PASSWORD PBM_APP_PASSWORD AUTH_SECRET CRON_SECRET BACKUP_PASSPHRASE; do echo "$n=$(openssl rand -hex 24)"; done
   ```

   Hex (letters and numbers only) matters: the two database passwords go inside connection URLs,
   where characters like `/` or `+` would break them. Paste each value straight into Docker
   Manager (step 4). Never paste them into chat, email or a commit. **Save `BACKUP_PASSPHRASE` in your password manager too:** if the server is lost, the
   backups on Google Drive can only be opened with it.
4. **App project:** create project `pbm` from `deploy/app.compose.yml` with these environment
   variables in Docker Manager:

   | Variable | Value |
   |---|---|
   | `APP_URL` | `https://c7xai.in` |
   | `POSTGRES_PASSWORD` | random (step 3). The database superuser; used by migrate and backup |
   | `PBM_APP_PASSWORD` | random (step 3). The app's own login |
   | `AUTH_SECRET` | random (step 3). Changing it signs everyone out |
   | `SMTP_PASSWORD` | the hello@c7xai.in mailbox password |
   | `MAIL_FROM` | optional, e.g. `"Product name" <hello@c7xai.in>`; defaults to the product name |
   | `OPENROUTER_API_KEY` | the OpenRouter key; give it a credit limit in OpenRouter |
   | `CRON_SECRET` | random (step 3) |
   | `BACKUP_PASSPHRASE` | random (step 3), also kept in your password manager |
   | `BACKUP_DRIVE_FOLDER` | optional; Google Drive folder, default `pbm-backups` |

   Empty values count as unset. On start, `pbm-db` becomes healthy, `pbm-migrate` applies the
   schema and exits, then `pbm-app` starts and `pbm-backup` takes a first backup.
5. **Google Drive for backups** (once, about five minutes; the token stays on the server):
   1. On your laptop, install rclone (rclone.org/downloads).
   2. In the hPanel browser terminal, run
      `docker exec -it pbm-backup rclone config --config /config/rclone/rclone.conf` and answer:
      `n` (new remote), name `gdrive`, storage `drive`, leave client id and secret empty, scope
      `drive.file` (rclone can then see only the files it creates, nothing else in your Drive),
      leave the service account empty, `n` to advanced config, and `n` to "Use web browser to
      automatically authenticate".
   3. It prints a command starting `rclone authorize "drive" "…"`. Run exactly that command on
      your laptop (it carries the `drive.file` scope). A browser opens: sign in to the Google
      account that should hold the backups and allow access. The laptop terminal prints a token.
   4. Paste that token into the hPanel terminal (not into chat or email), answer `n` to the shared
      drive question, `y` to keep the remote, and `q` to quit.
   5. Test it: `docker exec pbm-backup backup.sh`. It should end with "copied to Google Drive".
      A folder `pbm-backups` appears in your Drive, holding `.dump.gpg` files.

   Until this is done, backups stay on the server only and Docker Manager shows `pbm-backup` as
   unhealthy.
6. **Leave Supabase:** once the app runs here, delete the Supabase project (it has only test data).

## Releasing

Push to `main` → CI runs the checks (including the database tests against a throwaway
PostgreSQL) and publishes both images → update project `pbm` in Docker Manager (pulls `latest`,
runs migrations, recreates the containers). Roll back by pinning the images to a previous commit
SHA tag; migrations only ever add, so an older app runs on a newer schema.

Database changes: add `db/migrations/NNNN_name.sql` (next number). Every user-owned table needs
row-level security with the `own_rows` policy and grants to `pbm_user` and `pbm_service`, as in
`0001_schema.sql`.

## Backups and restore

- `pbm-backup` runs at start and nightly at 02:30 IST: `pg_dump` → gpg (AES-256, with
  `BACKUP_PASSPHRASE`) → `/backups` on the server (14 days) → Google Drive (30 days). Google sees
  only encrypted files.
- Docker Manager shows `pbm-backup` as unhealthy if the last backup or the last Google Drive copy
  is more than 26 hours old. Logs: `docker logs pbm-backup`.
- Hostinger also keeps weekly snapshots of the whole VPS, stored outside India (the backup server
  is named `my-kul`, so most likely Kuala Lumpur, Malaysia). They are not encrypted by us.
- **Restore** (tested): stop the app, then in the hPanel terminal:

  ```sh
  docker exec -it pbm-backup sh -c 'ls /backups'          # pick a file
  docker exec -it pbm-backup sh -c 'gpg -d /backups/FILE | pg_restore --clean --if-exists \
    --host=db --username=postgres --dbname=pbm'           # asks for the passphrase
  ```

  From Google Drive on a new server: download the file, then the same `gpg -d … | pg_restore`.

## Local development

Run PostgreSQL 16 or 17 locally, create a database, then:

```sh
DATABASE_ADMIN_URL=postgres://postgres@127.0.0.1:5432/pbm PBM_APP_PASSWORD=local-password-16chars npm run db:migrate
```

Set `DATABASE_URL=postgres://pbm_app:local-password-16chars@127.0.0.1:5432/pbm` and an
`AUTH_SECRET` in `.env.local`. Without `SMTP_PASSWORD`, sign-in codes are printed in the server
log. Database tests run when `TEST_DATABASE_URL` is set (same form as `DATABASE_URL`).

## Checks after a deploy

- `https://c7xai.in/api/health` returns `{"status":"ok"}`
- Sign in with a real address: the email arrives from hello@c7xai.in, and both the code and the
  link work
- `docker logs pbm-backup` shows a backup written (and copied to Google Drive once set up)
- `https://hanumat.life` still returns 200
