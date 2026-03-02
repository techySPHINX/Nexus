# ADR-006: Use Redis for Caching and Pub/Sub

**Date**: 2025-01-25
**Status**: Accepted
**Deciders**: Jagan Kumar Hotta, Core Engineering Team

---

## Context

Several platform features require fast volatile storage:

1. **Session / refresh token blacklisting** (immediate revocation without DB polling)
2. **Rate limiting** counters (per-IP, per-user)
3. **WebSocket pub/sub** (broadcasting messages across backend replicas)
4. **Hot-path caching** (feed rankings, notification counts)

Candidates:

- Redis
- Memcached
- In-process memory (Node.js Map)
- DynamoDB / DynamoDB Accelerator

---

## Decision

**Use Redis 7 (with AOF persistence)** for all in-memory caching, pub/sub, and rate limiting needs.

---

## Rationale

| Requirement                | Redis       | Memcached | In-process       |
| -------------------------- | ----------- | --------- | ---------------- |
| Pub/Sub                    | ✅ Native   | ❌        | ❌               |
| Persistence (AOF/RDB)      | ✅          | ❌        | ❌               |
| Sorted sets (leaderboards) | ✅          | ❌        | Manual           |
| Rate limiting (INCR+TTL)   | ✅          | Partial   | ❌ multi-replica |
| NestJS CacheManager        | First-class | Supported | Supported        |
| Cluster / Sentinel         | ✅          | ✅        | N/A              |

Key reasons:

1. **Socket.IO Redis adapter** for horizontal scaling: multiple backend replicas share the same pub/sub bus, ensuring WS messages are delivered regardless of which replica the client is connected to.
2. **Built-in data structures**: sorted sets for leaderboards (gamification), lists for notification queues, hashes for session data.
3. **`maxmemory-policy allkeys-lru`**: automatic eviction prevents cache from growing unbounded.
4. **AOF persistence**: surviving restarts without losing rate-limit counters or session state.

---

## Configuration

```
maxmemory 512mb
maxmemory-policy allkeys-lru
appendonly yes
```

Redis is started with `--requirepass ${REDIS_PASSWORD}` in production (mandatory via Docker Compose env var constraint).

---

## Consequences

**Positive**:

- Sub-millisecond cache lookups reduce DB load on hot paths
- Pub/Sub enables real-time features across stateless backend replicas
- AOF means cache warm-up is instant after restart
- `REDIS_PASSWORD` enforced: no unauthenticated access to Redis in production

**Negative**:

- Single Redis instance is a potential SPOF (mitigated by `restart: unless-stopped` and short TTLs)
- Memory limit (512MB) may need tuning as data grows

**Future**:

- Redis Sentinel or managed Redis (e.g. Upstash, ElastiCache) if HA is required
- RedisInsight or Grafana Redis datasource for cache monitoring
