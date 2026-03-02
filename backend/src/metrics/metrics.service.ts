/**
 * Application-level Prometheus metrics service.
 *
 * Exposes:
 *  - Default Node.js process metrics (CPU, memory, GC, event-loop lag)
 *  - Custom HTTP request counters and duration histograms
 *  - Active WebSocket connection gauge
 *  - Database query duration histogram
 *  - Cache hit/miss counters
 *
 * The /metrics HTTP endpoint (MetricsController) then calls
 * `register.metrics()` to publish the text exposition format consumed by
 * Prometheus.
 */
import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import * as client from 'prom-client';

@Injectable()
export class MetricsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MetricsService.name);

  // ── Prometheus registry ────────────────────────────────────────────────────
  readonly register = new client.Registry();

  // ── Default Node.js metrics ───────────────────────────────────────────────
  private defaultMetrics!: ReturnType<typeof client.collectDefaultMetrics>;

  // ── HTTP metrics ──────────────────────────────────────────────────────────
  readonly httpRequestsTotal = new client.Counter({
    name: 'nexus_http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status_code'] as const,
    registers: [this.register],
  });

  readonly httpRequestDurationSeconds = new client.Histogram({
    name: 'nexus_http_request_duration_seconds',
    help: 'HTTP request duration in seconds',
    labelNames: ['method', 'route', 'status_code'] as const,
    buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
    registers: [this.register],
  });

  // ── WebSocket metrics ──────────────────────────────────────────────────────
  readonly wsConnectionsActive = new client.Gauge({
    name: 'nexus_websocket_connections_active',
    help: 'Number of currently active WebSocket connections',
    registers: [this.register],
  });

  readonly wsMessagesTotal = new client.Counter({
    name: 'nexus_websocket_messages_total',
    help: 'Total number of WebSocket messages processed',
    labelNames: ['event'] as const,
    registers: [this.register],
  });

  // ── Database query metrics ─────────────────────────────────────────────────
  readonly dbQueryDurationSeconds = new client.Histogram({
    name: 'nexus_db_query_duration_seconds',
    help: 'Database query duration in seconds',
    labelNames: ['operation', 'model'] as const,
    buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2],
    registers: [this.register],
  });

  // ── Cache metrics ──────────────────────────────────────────────────────────
  readonly cacheHitsTotal = new client.Counter({
    name: 'nexus_cache_hits_total',
    help: 'Total number of cache hits',
    labelNames: ['key_prefix'] as const,
    registers: [this.register],
  });

  readonly cacheMissesTotal = new client.Counter({
    name: 'nexus_cache_misses_total',
    help: 'Total number of cache misses',
    labelNames: ['key_prefix'] as const,
    registers: [this.register],
  });

  // ── Business metrics ───────────────────────────────────────────────────────
  readonly authAttemptsTotal = new client.Counter({
    name: 'nexus_auth_attempts_total',
    help: 'Total authentication attempts',
    labelNames: ['result'] as const, // 'success' | 'failure'
    registers: [this.register],
  });

  readonly activeUsersGauge = new client.Gauge({
    name: 'nexus_active_users',
    help: 'Number of users with an active session in the last 15 minutes',
    registers: [this.register],
  });

  onModuleInit() {
    // Collect default metrics (heap, cpu, event loop lag, GC, open handles…)
    // under the nexus_ prefix so they are easily distinguished in dashboards.
    client.collectDefaultMetrics({
      register: this.register,
      prefix: 'nexus_nodejs_',
      // Collect every 10 s (default is 10 s, explicit for clarity)
      gcDurationBuckets: [0.001, 0.01, 0.1, 1, 2, 5],
    });

    this.logger.log('✅ Prometheus metrics collection started');
  }

  async onModuleDestroy() {
    this.register.clear();
  }

  /**
   * Return the complete Prometheus text exposition payload.
   * Called by MetricsController GET /metrics.
   */
  async getMetrics(): Promise<string> {
    return this.register.metrics();
  }

  /**
   * Convenience helper for recording an HTTP request observation.
   * Called by the HttpLoggingInterceptor after each request completes.
   */
  recordHttpRequest(
    method: string,
    route: string,
    statusCode: number,
    durationMs: number,
  ) {
    const statusStr = String(statusCode);
    this.httpRequestsTotal.inc({ method, route, status_code: statusStr });
    this.httpRequestDurationSeconds.observe(
      { method, route, status_code: statusStr },
      durationMs / 1000,
    );
  }

  /**
   * Record a database query observation.
   * Call this inside Prisma middleware or service methods.
   */
  recordDbQuery(operation: string, model: string, durationMs: number) {
    this.dbQueryDurationSeconds.observe(
      { operation, model },
      durationMs / 1000,
    );
  }

  /**
   * Increment cache hit counter.
   */
  recordCacheHit(keyPrefix: string) {
    this.cacheHitsTotal.inc({ key_prefix: keyPrefix });
  }

  /**
   * Increment cache miss counter.
   */
  recordCacheMiss(keyPrefix: string) {
    this.cacheMissesTotal.inc({ key_prefix: keyPrefix });
  }

  /** Track an auth attempt result ('success' or 'failure'). */
  recordAuthAttempt(result: 'success' | 'failure') {
    this.authAttemptsTotal.inc({ result });
  }
}
