# Production Deployment Guide

This guide covers deploying Nexus to production using Docker Compose, from first-time setup to upgrade procedures.

---

## Table of Contents

1. [System Requirements](#system-requirements)
2. [Environment Variables](#environment-variables)
3. [SSL / TLS Setup](#ssl--tls-setup)
4. [First-Time Deployment](#first-time-deployment)
5. [Database Migrations](#database-migrations)
6. [Health Checks & Smoke Tests](#health-checks--smoke-tests)
7. [Backup & Restore](#backup--restore)
8. [Upgrading](#upgrading)
9. [Monitoring Stack](#monitoring-stack)
10. [Troubleshooting](#troubleshooting)

---

## System Requirements

| Component      | Minimum          | Recommended      |
| -------------- | ---------------- | ---------------- |
| CPU            | 2 vCPU           | 4 vCPU           |
| RAM            | 4 GB             | 8 GB             |
| Disk           | 20 GB SSD        | 50 GB SSD        |
| Docker         | 24.x             | 25.x             |
| Docker Compose | V2 (2.20+)       | latest           |
| OS             | Ubuntu 22.04 LTS | Ubuntu 24.04 LTS |

> **Note:** Docker Compose V1 (`docker-compose`) is **not** supported. Use `docker compose` (V2).

---

## Environment Variables

Copy `.env.example` to `.env` and fill in every value before starting:

```bash
cp .env.example .env
```

> A root-level `.env.example` is provided in the repository. Backend-specific variables are also documented in `backend/.env.example`.

### Required Variables

| Variable             | Example                   | Description                                                              |
| -------------------- | ------------------------- | ------------------------------------------------------------------------ |
| `POSTGRES_DB`        | `nexus_prod`              | PostgreSQL database name                                                 |
| `POSTGRES_USER`      | `nexus`                   | PostgreSQL username                                                      |
| `POSTGRES_PASSWORD`  | _(strong password)_       | PostgreSQL password                                                      |
| `REDIS_PASSWORD`     | _(strong password)_       | Redis AUTH password (recommended; enforced when set via `--requirepass`) |
| `JWT_SECRET`         | _(64-char random string)_ | JWT signing secret                                                       |
| `JWT_REFRESH_SECRET` | _(64-char random string)_ | JWT refresh token secret                                                 |

### Application Variables

| Variable        | Example                     | Description                                     |
| --------------- | --------------------------- | ----------------------------------------------- |
| `NODE_ENV`      | `production`                | Node runtime environment                        |
| `FRONTEND_URLS` | `https://nexus.example.com` | Comma-separated allowed CORS origins            |
| `LOG_LEVEL`     | `info`                      | Log verbosity: `error`, `warn`, `info`, `debug` |

### Storage (AWS S3 / Compatible)

| Variable                | Description                                            |
| ----------------------- | ------------------------------------------------------ |
| `AWS_ACCESS_KEY_ID`     | AWS or MinIO access key                                |
| `AWS_SECRET_ACCESS_KEY` | AWS or MinIO secret key                                |
| `AWS_REGION`            | e.g. `us-east-1`                                       |
| `S3_BUCKET_NAME`        | Bucket for file uploads                                |
| `S3_ENDPOINT`           | Override endpoint for S3-compatible storage (optional) |
| `CDN_URL`               | CDN prefix for serving uploaded files (optional)       |

### Email

| Variable     | Example                      | Description             |
| ------------ | ---------------------------- | ----------------------- |
| `EMAIL_HOST` | `smtp.sendgrid.net`          | SMTP server host        |
| `EMAIL_PORT` | `587`                        | SMTP port               |
| `EMAIL_USER` | `apikey`                     | SMTP username           |
| `EMAIL_PASS` | _(API key)_                  | SMTP password / API key |
| `EMAIL_FROM` | `no-reply@nexus.example.com` | From address            |

### Monitoring & Observability

| Variable                     | Description                                     |
| ---------------------------- | ----------------------------------------------- |
| `SENTRY_DSN`                 | Sentry error-tracking DSN (backend)             |
| `VITE_SENTRY_DSN`            | Sentry DSN for frontend (set at build time)     |
| `GF_SECURITY_ADMIN_USER`     | Grafana admin username (default: `admin`)       |
| `GF_SECURITY_ADMIN_PASSWORD` | Grafana admin password — **change the default** |

### Generating Secrets

```bash
# 64-char JWT secret
openssl rand -hex 32

# Strong password
openssl rand -base64 24
```

---

## SSL / TLS Setup

Nexus expects SSL certificates at `./ssl/cert.pem` and `./ssl/key.pem` (as mounted in `nginx.conf`).

### Option A — Let's Encrypt (certbot)

```bash
sudo apt install certbot
sudo certbot certonly --standalone -d nexus.example.com

# Copy to project ssl/ directory
mkdir -p ssl
sudo cp /etc/letsencrypt/live/nexus.example.com/fullchain.pem ssl/cert.pem
sudo cp /etc/letsencrypt/live/nexus.example.com/privkey.pem ssl/key.pem
sudo chown $USER:$USER ssl/*.pem
```

Auto-renew + copy hook (`/etc/letsencrypt/renewal-hooks/deploy/nexus.sh`):

```bash
#!/bin/bash
cp /etc/letsencrypt/live/nexus.example.com/fullchain.pem /home/deploy/Nexus/ssl/cert.pem
cp /etc/letsencrypt/live/nexus.example.com/privkey.pem   /home/deploy/Nexus/ssl/key.pem
docker compose -f /home/deploy/Nexus/docker-compose.production.yml exec nginx nginx -s reload
```

### Option B — Self-Signed (development / staging only)

```bash
mkdir -p ssl
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout ssl/key.pem -out ssl/cert.pem \
  -subj "/CN=nexus.example.com"
```

---

## First-Time Deployment

```bash
# 1. Clone the repository
git clone https://github.com/techySPHINX/Nexus.git
cd Nexus

# 2. Configure environment
cp .env.example .env
# Edit .env with all required values

# 3. Set up SSL (see above)

# 4. Pull images and build
docker compose -f docker-compose.production.yml pull
docker compose -f docker-compose.production.yml build --no-cache

# 5. Start infrastructure (db, redis) first
docker compose -f docker-compose.production.yml up -d postgres redis
sleep 10   # wait for postgres healthcheck

# 6. Run database migrations
docker compose -f docker-compose.production.yml run --rm backend \
  npx prisma migrate deploy

# 7. Start all remaining services
docker compose -f docker-compose.production.yml up -d

# 8. Verify all containers are healthy
docker compose -f docker-compose.production.yml ps
```

All services should show `healthy` or `running` within ~60 seconds.

---

## Database Migrations

### Deploy pending migrations (production)

```bash
docker compose -f docker-compose.production.yml run --rm backend \
  npx prisma migrate deploy
```

### Check migration status

```bash
docker compose -f docker-compose.production.yml run --rm backend \
  npx prisma migrate status
```

### Emergency rollback

Prisma does not support automatic rollback. For rollback:

1. Identify the migration to undo in `backend/prisma/migrations/`
2. Write a manual SQL revert script
3. Apply it directly via `psql` against the production database
4. Delete the migration record from `_prisma_migrations`
5. Redeploy the previous application version

---

## Health Checks & Smoke Tests

### Service endpoints

| Service        | URL                                | Expected                        |
| -------------- | ---------------------------------- | ------------------------------- |
| Backend health | `GET http://localhost:3000/health` | `{"status":"ok"}`               |
| Frontend       | `http://localhost:3001`            | HTML 200                        |
| Nginx (HTTPS)  | `https://nexus.example.com/health` | `{"status":"ok"}`               |
| Prometheus     | `http://localhost:9090/-/healthy`  | `Prometheus Server is Healthy.` |
| Grafana        | `http://localhost:3002`            | Login page                      |
| Loki           | `http://localhost:3100/ready`      | `ready`                         |

### Quick smoke test

```bash
# Backend health
curl -sf http://localhost:3000/health | jq .

# Auth endpoint
curl -sf -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"wrong"}' | jq .statusCode

# WebSocket connectivity
node -e "const io=require('socket.io-client');const s=io('http://localhost:3000');s.on('connect',()=>{console.log('WS OK');s.close()})"
```

---

## Backup & Restore

### Automated backups

The `backup` service in Docker Compose runs on a cron schedule defined by `BACKUP_CRON` (default: `0 2 * * *` — daily at 02:00 UTC).

Backups are written to `./backups/` as compressed SQL dumps:

```
backups/
  nexus_backup_2026-03-02_02-00-00.sql.gz
```

Configure retention with `BACKUP_RETENTION_DAYS` (default: 7).

### Manual backup

```bash
docker compose -f docker-compose.production.yml run --rm backup backup
```

### Restore from backup

```bash
# Stop backend to prevent writes
docker compose -f docker-compose.production.yml stop backend

# Restore
gunzip -c backups/nexus_backup_2026-03-02_02-00-00.sql.gz | \
  docker exec -i nexus-postgres psql -U $POSTGRES_USER $POSTGRES_DB

# Restart backend
docker compose -f docker-compose.production.yml start backend
```

---

## Upgrading

```bash
# 1. Pull latest code
git fetch origin && git pull

# 2. Build new images
docker compose -f docker-compose.production.yml build --no-cache backend frontend

# 3. Run any new migrations BEFORE restarting app
docker compose -f docker-compose.production.yml run --rm backend \
  npx prisma migrate deploy

# 4. Rolling restart (zero-downtime with replicas=2)
docker compose -f docker-compose.production.yml up -d --no-deps backend frontend

# 5. Verify health
docker compose -f docker-compose.production.yml ps
curl -sf http://localhost:3000/health | jq .
```

---

## Monitoring Stack

Access URLs (port-forward or configure reverse proxy):

| Tool       | URL                     | Default Credentials                    |
| ---------- | ----------------------- | -------------------------------------- |
| Grafana    | `http://localhost:3002` | Set via `GF_SECURITY_ADMIN_*` env vars |
| Prometheus | `http://localhost:9090` | No auth by default                     |
| Loki (API) | `http://localhost:3100` | No auth by default                     |

> **Security**: Prometheus and Loki have **no built-in authentication**. These ports must **never** be exposed directly to the internet. Access them only via VPN, SSH tunnel, or an authenticated reverse proxy. Review all Docker port bindings before deploying to a public host.

Grafana datasources are auto-provisioned (Prometheus + Loki) via `grafana/provisioning/datasources/datasources.yml`. No manual configuration is needed after first start.

**Application metrics** endpoint: `GET /metrics` (requires JWT + ADMIN role).

---

## Troubleshooting

### Container fails to start

```bash
# Check logs
docker compose -f docker-compose.production.yml logs --tail=100 backend

# Check resource usage
docker stats --no-stream
```

### Database connection errors

```bash
# Test connectivity from backend container
docker compose -f docker-compose.production.yml exec backend \
  npx prisma db execute --stdin <<< "SELECT 1;"
```

### Redis authentication failure

Ensure `REDIS_PASSWORD` is set in `.env` **and** the Redis container was started with `--requirepass $REDIS_PASSWORD`. When changing the password:

1. Update `.env`
2. `docker compose -f docker-compose.production.yml up -d --no-deps redis`
3. Restart backend: `docker compose -f docker-compose.production.yml restart backend`

### Nginx 502 Bad Gateway

The backend is expected at `http://backend:3000`. Check:

1. Backend container is healthy: `docker inspect nexus-backend | jq '.[0].State.Health'`
2. Both are on the same `nexus-network`: `docker network inspect nexus-network`

### Grafana shows no data

- Confirm Prometheus scrape targets: `http://localhost:9090/targets`
- Check Loki is ready: `curl http://localhost:3100/ready`
- Validate datasources in Grafana UI under **Configuration → Data Sources**
