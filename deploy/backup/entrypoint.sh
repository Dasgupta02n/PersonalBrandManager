#!/bin/sh
# Takes a backup at start (so a new deploy proves the setup works), then nightly at 02:30 IST.
# Without BACKUP_PASSPHRASE it waits (and shows unhealthy) until the project is redeployed with one.
set -eu
if [ -z "${BACKUP_PASSPHRASE:-}" ]; then
  echo "BACKUP_PASSPHRASE is not set: no backups until it is added in Docker Manager (project pbm)" >&2
  while :; do sleep 3600; done
fi
echo "30 21 * * * /usr/local/bin/backup.sh > /proc/1/fd/1 2>&1" > /etc/crontabs/root
/usr/local/bin/backup.sh || echo "backup at start failed; will retry on schedule" >&2
exec crond -f -l 8
