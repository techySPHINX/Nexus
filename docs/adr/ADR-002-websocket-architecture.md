# ADR-002: WebSocket Gateway Architecture & Cache Service Consolidation

**Date:** 2026-03-02  
**Status:** Accepted  
**Issue:** [#170 – Consolidate Duplicate Cache Services and WebSocket Gateways](https://github.com/techySPHINX/Nexus/issues/170)  
**Authors:** Backend Team

---

## Context

The backend had grown to include **three cache services** and **five WebSocket gateways**, causing:

- Duplicate Redis connections (wasted memory, connection slot exhaustion on cloud Redis tiers)
- Confusing responsibility boundaries (which gateway handles which event?)
- Hard-to-trace bugs when two gateways emitted conflicting events to the same client

### Cache Duplication (before)

| Service                | Location                                        | Own Redis connection?       |
| ---------------------- | ----------------------------------------------- | --------------------------- |
| `CacheService`         | `src/common/services/cache.service.ts`          | ✅ Yes                      |
| `CachingService`       | `src/common/services/caching.service.ts`        | ✅ Yes (via `RedisService`) |
| `CacheEnhancedService` | `src/common/services/cache-enhanced.service.ts` | ✅ Yes                      |

### WebSocket Gateway Duplication (before)

| Gateway                    | Namespace        | Responsibility                               |
| -------------------------- | ---------------- | -------------------------------------------- |
| `FastChatGateway`          | `/chat`          | Chat messages (duplicate)                    |
| `ImprovedMessagingGateway` | `/messaging`     | Chat messages                                |
| `UnifiedWebSocketGateway`  | `/`              | Combined events (users, notifications, chat) |
| `NotificationGateway`      | `/notifications` | Push notifications                           |
| `DashboardGateway`         | `/dashboard`     | Dashboard live updates                       |

---

## Decision

### Cache Services — Single Canonical Service

**`CacheService` (`src/common/services/cache.service.ts`) is the canonical cache service.**

- Provided and exported by `CommonModule` (`@Global`) — all modules get it via DI.
- `CachingService` is retained as a thin wrapper over `RedisService` for backward compatibility but shall not be injected from `AppModule` providers; it must only be requested from `CommonModule` if needed.
- `CacheEnhancedService` is retained in `CommonModule` for its local L1 cache feature but is **not** the primary interface. New code should inject `CacheService` directly.
- **No new Redis connections are opened from `app.module.ts`** — the shared `RedisService` pool is the only connection manager.

### WebSocket Gateways — Domain-Specific Architecture

The "one gateway to rule them all" (`UnifiedWebSocketGateway`) was evaluated but rejected because:

1. It creates a fan-out problem: every connected client receives every event type, requiring expensive client-side filtering.
2. Domain modules cannot be extracted to microservices without rewriting the gateway.

**Chosen architecture: domain-specific gateways.**

| Gateway                    | Namespace        | Stays?     | Rationale                                                              |
| -------------------------- | ---------------- | ---------- | ---------------------------------------------------------------------- |
| `ImprovedMessagingGateway` | `/messaging`     | ✅ Keep    | Sole chat gateway with auth, typing indicators, read receipts          |
| `UnifiedWebSocketGateway`  | `/`              | ✅ Keep    | System-wide events: presence, generic broadcasts                       |
| `NotificationGateway`      | `/notifications` | ✅ Keep    | Push notification delivery to connected clients                        |
| `DashboardGateway`         | `/dashboard`     | ✅ Keep    | Dashboard KPI live updates (admin + user)                              |
| `FastChatGateway`          | `/chat`          | ❌ Removed | Superseded by `ImprovedMessagingGateway`; had its own Redis connection |

`FastChatGateway` was removed because:

- Its functionality (send message, typing, read receipt) is fully covered by `ImprovedMessagingGateway`.
- It opened a **separate independent Redis connection** inside its constructor instead of reusing `RedisService`.
- Nothing outside `MessagingModule` was injecting it.

---

## Consequences

### Positive

- **Fewer Redis connections**: removes 1 standalone connection from `FastChatGateway`.
- **Single source of truth for chat**: `ImprovedMessagingGateway` is the definitive chat socket.
- **Simpler reasoning**: each gateway has a clear, non-overlapping responsibility.
- **`AppModule` no longer re-provides** services already exported by `CommonModule`.

### Negative / Trade-offs

- Frontend clients that were connecting to `/chat` directly must reconnect to `/messaging`. (No known production clients were using `/chat` — it was unused.)
- `CachingService` and `CacheEnhancedService` remain in the codebase to avoid breaking changes; a follow-up issue should migrate remaining usages and delete the files.

---

## Follow-up Tickets

- [ ] Fully delete `CachingService` after confirming no callers (follow-up)
- [ ] Fully delete `CacheEnhancedService` after confirming no callers (follow-up)
- [ ] Add integration tests for each remaining WebSocket gateway namespace
