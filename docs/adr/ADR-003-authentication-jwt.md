# ADR-003: Use JWT for Authentication

**Date**: 2025-01-20
**Status**: Accepted
**Deciders**: Jagan Kumar Hotta, Core Engineer

---

## Context

Nexus is a stateless API-first platform with multiple clients (React SPA, future mobile apps). Authentication must work across all clients without server-side session storage, while still supporting token revocation (logout, security events) and refresh workflows.

Candidates evaluated:

- JWT (JSON Web Tokens) with refresh token rotation
- Opaque bearer tokens stored in database
- Session cookies with server-side storage (Redis)

---

## Decision

**Use JWT (RS256 / HS256) with dual-token strategy** — short-lived access tokens (15m) paired with long-lived refresh tokens (7d) stored in the database for revocation support.

---

## Rationale

1. **Stateless access tokens**: No database lookup needed on every request — the JWT carries user ID, role, and expiry, verified by `@nestjs/jwt` with the `JWT_SECRET`.
2. **Revocable refresh tokens**: Stored in `RefreshToken` table with `isRevoked` flag. Allows `/auth/logout` and `/auth/logout-all` to invalidate sessions without waiting for access token expiry.
3. **Role encoding**: The `role` claim (`STUDENT`, `ALUMNI`, `ADMIN`) is embedded in the JWT, enabling `RolesGuard` to enforce access without extra DB queries.
4. **WebSocket auth**: JWT is passed via `socket.io` `auth.token` field and verified in the `AuthGateway`, giving the same identity model for WS connections.

---

## Access Token Payload

```json
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "role": "ALUMNI",
  "iat": 1700000000,
  "exp": 1700000900
}
```

## Refresh Token Flow

```
Client          Backend
  │── POST /auth/login ──────────────►│
  │◄─ { accessToken, refreshToken } ──│  (JWT stored in RefreshToken table)
  │                                   │
  │── POST /auth/refresh ─────────────►│
  │   { refreshToken }                │  (validates, rotates, returns new pair)
  │◄─ { accessToken }  ───────────────│
```

---

## Consequences

**Positive**:

- No session storage needed for access token validation (scales horizontally)
- Role-based guards are fast (no DB call)
- Standard: any client can decode token payload (for display purposes)

**Negative**:

- Access tokens cannot be immediately revoked (15-minute window)
- Secret rotation requires coordinated redeployment

**Mitigation**:

- Keep access token TTL short (15 minutes)
- `SecurityEvent` table logs suspicious activity for audit
- `LoginAttempt` table provides brute-force detection
- All tokens are HTTPS-only in production (no cookie exposure)
