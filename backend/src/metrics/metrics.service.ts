import { Injectable, OnModuleInit } from '@nestjs/common';
import {
  Registry,
  collectDefaultMetrics,
  Counter,
  Histogram,
  Gauge,
  register,
} from 'prom-client';

/**
 * MetricsService bootstraps prom-client default metrics (CPU, memory, event
 * loop lag, GC pause times, active handles/requests, etc.) and exposes
 * application-level counters and histograms for HTTP traffic.
 *
 * The registry is intentionally the global default `register` so that all
 * metrics created anywhere in the process end up in a single scrape endpoint.
 */
@Injectable()
export class MetricsService implements OnModuleInit {
  readonly registry: Registry = register;

  /** Total HTTP requests, labelled by method, route and status code. */
  readonly httpRequestsTotal: Counter<string> = new Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status_code'],
  });

  /** HTTP request duration in seconds, labelled by method, route and status. */
  readonly httpRequestDurationSeconds: Histogram<string> = new Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  });

  /** Number of active WebSocket connections. */
  readonly wsConnectionsActive: Gauge<string> = new Gauge({
    name: 'ws_connections_active',
    help: 'Number of currently active WebSocket connections',
  });

  /** Total errors, labelled by error type. */
  readonly errorsTotal: Counter<string> = new Counter({
    name: 'errors_total',
    help: 'Total number of application errors',
    labelNames: ['type'],
  });

  onModuleInit(): void {
    // Collect default Node.js runtime metrics every 10 seconds:
    //   process_cpu_seconds_total, process_resident_memory_bytes,
    //   nodejs_heap_used_bytes, nodejs_eventloop_lag_seconds, etc.
    collectDefaultMetrics({ register: this.registry, prefix: 'nexus_' });
  }

  /** Returns all metrics serialised for Prometheus text-based exposition format. */
  async getMetrics(): Promise<string> {
    return this.registry.metrics();
  }

  /** Content-type header Prometheus expects when scraping. */
  getContentType(): string {
    return this.registry.contentType;
  }
}
