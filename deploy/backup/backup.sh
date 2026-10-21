#!/bin/sh
# One encrypted backup of the database: on the server for 14 days, on Google Drive for 30.
#
#   POSTGRES_PASSWORD    the database superuser's password
#   BACKUP_PASSPHRASE    encrypts the backup (AES-256). Keep a copy off the server: without it,
#                        no backup can be restored.
#   BACKUP_DRIVE_FOLDER  folder on Google Drive (default: pbm-backups)
#   DB_HOST, DB_NAME     where the database is (default: db, pbm)
#
# Google Drive is used once rclone is configured with a remote named "gdrive" (docs/DEPLOY.md).
# Restore: gpg -d FILE | pg_restore --clean --if-exists -d DATABASE_URL
set -eu -o pipefail

stamp=$(date -u +%Y-%m-%dT%H%MZ)
file="/backups/pbm-$stamp.dump.gpg"
config=/config/rclone/rclone.conf
folder="gdrive:${BACKUP_DRIVE_FOLDER:-pbm-backups}"

PGPASSWORD="$POSTGRES_PASSWORD" pg_dump --host="${DB_HOST:-db}" --username=postgres --dbname="${DB_NAME:-pbm}" --format=custom \
  | gpg --batch --yes --quiet --symmetric --cipher-algo AES256 --pinentry-mode loopback \
      --passphrase-fd 3 --output "$file.part" 3<<PASS
$BACKUP_PASSPHRASE
PASS
mv "$file.part" "$file"
echo "backup written: $file ($(du -h "$file" | cut -f1))"

find /backups -name 'pbm-*.dump.gpg' -mtime +14 -delete
find /backups -name '*.part' -delete

if [ -s "$config" ]; then
  rclone --config "$config" copy "$file" "$folder"
  rclone --config "$config" delete --min-age 30d --include 'pbm-*.dump.gpg' "$folder"
  touch /backups/.drive-ok
  echo "copied to Google Drive: $folder"
else
  echo "Google Drive not set up yet: backup kept on this server only" >&2
fi
