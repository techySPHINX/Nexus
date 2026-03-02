# ADR-004: Containerise All Services with Docker Compose

**Date**: 2025-02-01
**Status**: Accepted
**Deciders**: Jagan Kumar Hotta, Core Engineering Team

---

## Context

Nexus consists of multiple services: NestJS backend, Vite/React frontend, PostgreSQL, Redis, Nginx, backup runner, Prometheus, Grafana, Loki, and Promtail. Deploying and orchestrating these consistently across environments (local development, staging, production) requires a container strategy.

Candidates evaluated:

- Docker Compose (single-host)
- Kubernetes (k8s)
- Nomad
- Manual systemd + bare-metal

---

## Decision

**Use Docker Compose V2 with `docker-compose.production.yml`** for production deployments on a single host. Development uses individual `npm run start:dev` / `npm start` processes for faster iteration.

---

## Rationale

1. **Simplicity over complexity**: At current scale (single production server, <5k concurrent users based on load tests), Kubernetes adds significant operational overhead with no meaningful benefit.
2. **`docker compose` V2 features**: Named volumes, health check conditions (`service_healthy`), network isolation, resource limits (`deploy.resources`), and `depends_on` chains are all available without Kubernetes.
3. **Reproducibility**: `docker-compose.production.yml` pins image tags and build contexts, so `docker compose up -d` is a complete deployment from any clean host.
4. **Network isolation**: Each service category (app, monitoring) is on `nexus-network`. Postgres and Redis are only exposed to the internal Docker network, not the host.

---

## Architecture

```
Host
 └── Docker engine
      ├── nexus-network (bridge)
      │    ├── nexus-postgres    (exposed internally only)
      │    ├── nexus-redis       (exposed internally only)
      │    ├── nexus-backend     (:3000, expose only — not host port)
      │    ├── nexus-frontend    (:3001 → :80)
      │    ├── nexus-nginx       (:443, :80 → host)
      │    ├── prometheus        (:9090)
      │    ├── grafana           (:3002 → :3000)
      │    ├── loki              (:3100)
      │    └── promtail          (reads /var/run/docker.sock)
      └── Named volumes
           ├── postgres_data
           ├── redis_data
           ├── prometheus_data
           ├── grafana_data
           └── loki_data
```

---

## Consequences

**Positive**:

- One command deployment (`docker compose up -d`)
- Service health checks prevent premature startup ordering issues
- Easy local replication of production environment
- Named volumes ensure data durability across container restarts

**Negative**:

- No automatic horizontal scaling across multiple hosts
- Rolling updates require brief downtime unless `replicas: 2` is used (configured for backend)
- Docker socket mounting for Promtail is a security consideration (read-only mount mitigates)

**Future**:

- If traffic exceeds single-host capacity, migrate backend/frontend to a managed container platform (e.g. AWS ECS, Railway, Render), keeping PostgreSQL and Redis as managed services.
