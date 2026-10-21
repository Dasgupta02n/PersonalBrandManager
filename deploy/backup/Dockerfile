# Nightly encrypted database backups: pg_dump, encrypted with gpg, kept 14 days on the server and
# copied to Google Drive with rclone. Published as ghcr.io/dasgupta02n/personalbrandmanager-backup.
FROM postgres:17-alpine
RUN apk add --no-cache gnupg rclone
COPY --chmod=755 backup.sh entrypoint.sh /usr/local/bin/
VOLUME ["/backups", "/config/rclone"]
# Unhealthy when the last backup, or the last copy to Google Drive, is more than 26 hours old
# (so it also shows unhealthy until Google Drive is set up).
HEALTHCHECK --interval=15m --timeout=10s --start-period=10m \
  CMD find /backups -name 'pbm-*.dump.gpg' -mmin -1560 | grep -q . && find /backups -name .drive-ok -mmin -1560 | grep -q .
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
