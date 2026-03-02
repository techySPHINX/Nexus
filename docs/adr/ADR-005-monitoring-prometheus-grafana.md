# ADR-005: Use Prometheus + Grafana for Metrics and Alerting

**Date**: 2025-02-10
**Status**: Accepted
**Deciders**: Jagan Kumar Hotta, Core Engineering Team

---

## Context

As Nexus moves toward production, the team needs visibility into service health, performance trends, and actionable alerts. The monitoring stack must integrate with the existing Docker Compose infrastructure and provide:

- Application-level metrics (request rates, error rates, latencies)
- Infrastructure metrics (CPU, memory, heap)
- Alerting on degraded conditions (e.g. high error rate, memory exhaustion)

Candidates:

- Prometheus + Grafana (self-hosted)
- Datadog
- New Relic
- AWS CloudWatch

---

## Decision

**Use Prometheus for metric collection, Grafana for visualisation, and Alertmanager** configured via `alerts.yml` for alerting.

Application metrics are exposed from the NestJS backend via `prom-client` at `GET /metrics` (JWT + ADMIN protected), and scraped by Prometheus every 15 seconds.

---

## Rationale

1. **Open source + no per-metric billing**: Datadog/New Relic cost scales with data volume — unsuitable for a budget-conscious platform.
2. **`prom-client` for NestJS**: First-class Node.js Prometheus client with default metrics (event loop lag, heap, GC) and custom counters/histograms.
3. **Grafana dashboards**: Rich, configurable dashboards with alerting rules — same Grafana instance serves both Prometheus (metrics) and Loki (logs).
4. **`alerts.yml` integration**: Prometheus alerting rules are code-reviewed alongside application changes, preventing config drift.

---

## Custom Metrics Defined (`MetricsService`)

| Metric                                     | Type      | Description                            |
| ------------------------------------------ | --------- | -------------------------------------- |
| `nexus_http_requests_total`                | Counter   | HTTP requests by method, route, status |
| `nexus_http_request_duration_seconds`      | Histogram | Request latency distribution           |
| `nexus_ws_connections_total`               | Counter   | WebSocket connection events            |
| `nexus_ws_active_connections`              | Gauge     | Current active WS connections          |
| `nexus_db_query_duration_seconds`          | Histogram | Prisma query latencies                 |
| `nexus_cache_hits_total` / `_misses_total` | Counter   | Redis cache performance                |
| `nexus_auth_login_attempts_total`          | Counter   | By success/failure                     |
| `nexus_active_users`                       | Gauge     | Currently active users                 |

---

## Consequences

**Positive**:

- Full observability stack at zero licensing cost
- Alerting rules are version-controlled (`alerts.yml`)
- Grafana provisioned automatically via `grafana/provisioning/`
- Single pane of glass: metrics + logs in same Grafana instance

**Negative**:

- Requires someone to maintain Prometheus config and Grafana dashboards
- No long-term metric storage by default (local volume, no remote write configured yet)

**Mitigation**:

- Prometheus data volume (`prometheus_data`) persists restarts
- `alerts.yml` includes key production alerts (high error rate, heap saturation)
- Remote write to Grafana Cloud can be added later for long-term retention
