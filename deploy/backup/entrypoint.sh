#!/bin/sh
# Takes a backup at start (so a new deploy proves the setup works), then nightly at 02:30 IST.
set -eu
: "${POSTGRES_PASSWORD:?POSTGRES_PASSWORD is required}"
: "${BACKUP_PASSPHRASE:?BACKUP_PASSPHRASE is required}"
echo "30 21 * * * /usr/local/bin/backup.sh > /proc/1/fd/1 2>&1" > /etc/crontabs/root
/usr/local/bin/backup.sh || echo "backup at start failed; will retry on schedule" >&2
exec crond -f -l 8
