# ADR-001: Use PostgreSQL as the Primary Database

**Date**: 2025-01-15
**Status**: Accepted
**Deciders**: Jagan Kumar Hotta, Core Engineering Team

---

## Context

Nexus requires a relational database to store users, posts, connections, messages, and other structured domain data. The system needs strong ACID guarantees, complex query support (joins, filters, pagination), and a mature ecosystem with ORM tooling.

Candidates evaluated:

- PostgreSQL
- MySQL / MariaDB
- MongoDB
- SQLite

---

## Decision

**Use PostgreSQL 15** as the sole primary database for all persistent structured data.

---

## Rationale

| Factor             | PostgreSQL               | MySQL     | MongoDB         |
| ------------------ | ------------------------ | --------- | --------------- |
| ACID compliance    | Full                     | Full      | Partial (repl.) |
| JSON support       | Native JSONB             | Limited   | Native          |
| Full-text search   | Built-in `tsvector`      | Limited   | Atlas Search    |
| Prisma support     | First-class              | Good      | Good            |
| Row-level security | Yes                      | Partial   | No              |
| Open source        | Yes (PostgreSQL License) | Yes (GPL) | SSPL            |

Key reasons:

1. **Prisma ORM** has best-in-class PostgreSQL support, including migrations, type generation, and raw query capabilities.
2. **JSONB columns** allow semi-structured data (metadata, settings) without schema changes.
3. **`pg_isready`** enables straightforward liveness probes in Docker healthchecks.
4. **Row-level security** and **advanced indexing** (partial, GIN, BRIN) support the performance optimizations required at scale.
5. Team has existing PostgreSQL expertise.

---

## Consequences

**Positive**:

- Strongly typed schema enforced by Prisma migrations
- `@@index` and partial indexes reduce N+1 and slow-query risks
- Native UUID support for globally unique IDs
- `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` (used in migrations) is idiomatic

**Negative**:

- Horizontal write scaling requires Citus or read replicas (not needed at current scale)
- More operational overhead than SQLite for local development

**Mitigation**:

- Use Docker Compose for local PostgreSQL, eliminating install friction
- Maintain `DATABASE_URL` as the single connection string across all environments
