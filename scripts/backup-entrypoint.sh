#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Backup container entrypoint
#
# 1. Validates that the required env vars are present.
# 2. Writes a crontab entry using BACKUP_CRON (default: 0 2 * * * = 02:00 UTC).
# 3. Starts crond in the foreground (busybox crond -f).
# 4. Immediately runs a first backup so operators can verify the setup works
#    before waiting for the scheduled run.
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

log()  { echo "[$(date -u '+%Y-%m-%dT%H:%M:%SZ')] INFO  $*"; }
die()  { echo "[$(date -u '+%Y-%m-%dT%H:%M:%SZ')] ERROR $*" >&2; exit 1; }

# ── Validate ──────────────────────────────────────────────────────────────────
: "${DATABASE_URL:?DATABASE_URL must be set}"
: "${BACKUP_S3_BUCKET:?BACKUP_S3_BUCKET must be set}"
: "${AWS_ACCESS_KEY_ID:?AWS_ACCESS_KEY_ID must be set}"
: "${AWS_SECRET_ACCESS_KEY:?AWS_SECRET_ACCESS_KEY must be set}"

BACKUP_CRON="${BACKUP_CRON:-0 2 * * *}"

# ── Write crontab ─────────────────────────────────────────────────────────────
# Export all env vars into a file sourced by the cron job, because crond
# doesn't inherit the Docker container's environment variables.
ENV_FILE=/etc/backup-env
printenv | grep -E '^(DATABASE_URL|BACKUP_S3_BUCKET|AWS_|S3_ENDPOINT|BACKUP_RETENTION_DAYS)' \
  | sed 's/^/export /' > "${ENV_FILE}"
chmod 600 "${ENV_FILE}"

CRONTAB_FILE=/etc/crontabs/root
echo "${BACKUP_CRON} . ${ENV_FILE} && /usr/local/bin/backup-db.sh >> /var/log/backup.log 2>&1" \
  > "${CRONTAB_FILE}"

log "Cron schedule: ${BACKUP_CRON}"
log "Crontab:"
cat "${CRONTAB_FILE}"

# ── Run an initial backup immediately ────────────────────────────────────────
log "Running initial backup on container start ..."
if /usr/local/bin/backup-db.sh; then
  log "Initial backup succeeded."
else
  log "WARNING: Initial backup failed — check logs. Cron schedule still active."
fi

# ── Start crond in the foreground ────────────────────────────────────────────
log "Starting crond (schedule: ${BACKUP_CRON}) ..."
exec crond -f -l 8
