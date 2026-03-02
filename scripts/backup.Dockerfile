# ─────────────────────────────────────────────────────────────────────────────
# Backup container image — PostgreSQL + AWS CLI on Alpine
#
# Installs pg_dump (postgresql-client), the AWS CLI, gzip, and bash.
# The container's entrypoint installs a cron job based on the BACKUP_CRON env
# var and then starts crond in the foreground so Docker can manage it.
# ─────────────────────────────────────────────────────────────────────────────
FROM alpine:3.19

RUN apk add --no-cache \
      bash \
      gzip \
      postgresql15-client \
      aws-cli \
      tzdata \
    && rm -rf /var/cache/apk/*

# Copy the backup script
COPY backup-db.sh /usr/local/bin/backup-db.sh
RUN chmod +x /usr/local/bin/backup-db.sh

# Entrypoint: write the cron schedule from the BACKUP_CRON env var and
# run crond in the foreground (so the process stays alive and Docker can
# restart the container if it crashes).
COPY backup-entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
