#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Nexus — Automated PostgreSQL Backup Script
#
# Usage: ./scripts/backup-db.sh
#
# Required environment variables:
#   DATABASE_URL           — PostgreSQL connection URL
#                            (postgresql://user:pass@host:5432/dbname)
#   BACKUP_S3_BUCKET       — S3 bucket name  (e.g. s3://nexus-backups)
#   AWS_ACCESS_KEY_ID      — AWS / Backblaze B2 / Cloudflare R2 key ID
#   AWS_SECRET_ACCESS_KEY  — AWS / Backblaze B2 / Cloudflare R2 secret
#
# Optional:
#   AWS_REGION             — Defaults to us-east-1
#   S3_ENDPOINT            — Custom endpoint for S3-compatible storage
#                            (e.g. https://s3.us-west-001.backblazeb2.com)
#   BACKUP_RETENTION_DAYS  — Delete backups older than N days (default: 30)
#
# The backup is compressed with gzip and uploaded to S3 with a timestamp
# filename in the format: nexus-backup-YYYY-MM-DD_HH-MM-SS.dump.gz
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

# ── Helpers ──────────────────────────────────────────────────────────────────
log()  { echo "[$(date -u '+%Y-%m-%dT%H:%M:%SZ')] INFO  $*"; }
warn() { echo "[$(date -u '+%Y-%m-%dT%H:%M:%SZ')] WARN  $*" >&2; }
die()  { echo "[$(date -u '+%Y-%m-%dT%H:%M:%SZ')] ERROR $*" >&2; exit 1; }

# ── Validate required variables ──────────────────────────────────────────────
: "${DATABASE_URL:?DATABASE_URL is required}"
: "${BACKUP_S3_BUCKET:?BACKUP_S3_BUCKET is required (e.g. s3://nexus-backups)}"
: "${AWS_ACCESS_KEY_ID:?AWS_ACCESS_KEY_ID is required}"
: "${AWS_SECRET_ACCESS_KEY:?AWS_SECRET_ACCESS_KEY is required}"

AWS_REGION="${AWS_REGION:-us-east-1}"
BACKUP_RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"

# ── pg_dump connection — libpq natively parses the full DATABASE_URL ─────────
# Passing --dbname with the full URL handles passwords containing special
# characters, IPv6 hosts, and query-string options without brittle shell
# string splitting.

# ── Build filenames ───────────────────────────────────────────────────────────
TIMESTAMP="$(date -u '+%Y-%m-%d_%H-%M-%S')"
FILENAME="nexus-backup-${TIMESTAMP}.dump.gz"
TMP_FILE="/tmp/${FILENAME}"

# ── Take the backup ───────────────────────────────────────────────────────────
log "Starting pg_dump using DATABASE_URL ..."
pg_dump \
  --dbname="${DATABASE_URL}" \
  --format=custom \
  --compress=9 \
  | gzip -9 > "${TMP_FILE}"

BACKUP_SIZE="$(du -sh "${TMP_FILE}" | cut -f1)"
log "Backup complete (${BACKUP_SIZE}): ${FILENAME}"

# ── Upload to S3 ──────────────────────────────────────────────────────────────
S3_PATH="${BACKUP_S3_BUCKET%/}/${FILENAME}"

AWS_ARGS=(
  s3 cp "${TMP_FILE}" "${S3_PATH}"
  --region "${AWS_REGION}"
  --storage-class STANDARD_IA
)

# Support S3-compatible endpoints (Backblaze B2, Cloudflare R2, MinIO, etc.)
if [[ -n "${S3_ENDPOINT:-}" ]]; then
  AWS_ARGS+=(--endpoint-url "${S3_ENDPOINT}")
fi

log "Uploading backup to ${S3_PATH} ..."
aws "${AWS_ARGS[@]}"
log "Upload complete."

# ── Clean up local temp file ──────────────────────────────────────────────────
rm -f "${TMP_FILE}"

# ── Optional: prune old backups from S3 ──────────────────────────────────────
# Lists objects in the bucket with the nexus-backup- prefix and deletes any
# whose LastModified date is older than BACKUP_RETENTION_DAYS.
if [[ "${BACKUP_RETENTION_DAYS}" -gt 0 ]]; then
  # Use epoch arithmetic so this works on Alpine (busybox date does not
  # support `date -d "N days ago"` or GNU `--iso-8601` flag).
  CUTOFF_EPOCH=$(( $(date -u +%s) - BACKUP_RETENTION_DAYS * 86400 ))
  CUTOFF_ISO="$(date -u -d "@${CUTOFF_EPOCH}" '+%Y-%m-%dT%H:%M:%SZ' 2>/dev/null \
    || date -u -r "${CUTOFF_EPOCH}" '+%Y-%m-%dT%H:%M:%SZ' 2>/dev/null \
    || echo "1970-01-01T00:00:00Z")"

  if [[ "${CUTOFF_EPOCH}" -gt 0 ]]; then
    log "Pruning backups older than ${BACKUP_RETENTION_DAYS} days from ${BACKUP_S3_BUCKET} ..."

    LIST_ARGS=(s3api list-objects-v2
      --bucket "${BACKUP_S3_BUCKET#s3://}"
      --prefix "nexus-backup-"
      --query "Contents[?LastModified<='${CUTOFF_ISO}'].Key"
      --output text
    )
    [[ -n "${S3_ENDPOINT:-}" ]] && LIST_ARGS+=(--endpoint-url "${S3_ENDPOINT}")

    OLD_KEYS="$(aws "${LIST_ARGS[@]}" 2>/dev/null || true)"

    if [[ -n "${OLD_KEYS}" ]]; then
      echo "${OLD_KEYS}" | tr '\t' '\n' | while read -r key; do
        [[ -z "${key}" || "${key}" == "None" ]] && continue
        log "Deleting old backup: ${key}"
        DEL_ARGS=(s3 rm "s3://${BACKUP_S3_BUCKET#s3://}/${key}")
        [[ -n "${S3_ENDPOINT:-}" ]] && DEL_ARGS+=(--endpoint-url "${S3_ENDPOINT}")
        aws "${DEL_ARGS[@]}"
      done
    else
      log "No old backups to prune."
    fi
  else
    warn "Could not compute cutoff date — skipping retention pruning."
  fi
fi

log "Backup job finished successfully."
