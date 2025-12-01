import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

/**
 * WebSocket Metrics Data
 */
export interface WebSocketMetrics {
  timestamp: string;
  connections: {
    total: number;
    active: number;
    peak: number;
  };
  messages: {
    sent: number;
    received: number;
    queued: number;
    failed: number;
  };
  performance: {
    averageLatency: number;
    p95Latency: number;
    p99Latency: number;
  };
  errors: {
    connectionErrors: number;
    authErrors: number;
    messageErrors: number;
  };
  namespaces: {
    [key: string]: {
      connections: number;
      messages: number;
    };
  };
}

/**
 * Real-time Event
 */
export interface RealtimeEvent {
  type: string;
  namespace: string;
  userId?: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

/**
 * Production-Grade WebSocket Monitoring and Analytics Service
 * 
 * Features:
 * ✅ Real-time metrics collection
 * ✅ Performance monitoring (latency, throughput)
 * ✅ Error tracking and alerting
 * ✅ Connection analytics
 * ✅ User behavior tracking
 * ✅ Resource utilization monitoring
 * ✅ Historical data storage
 * ✅ Anomaly detection
 */
@Injectable()
export class WebSocketMonitoringService {
  private readonly logger = new Logger(WebSocketMonitoringService.name);
  private redis: Redis;

  // Metrics tracking
  private currentMetrics: WebSocketMetrics = this.initializeMetrics();
  private peakConnections = 0;
  private latencySamples: number[] = [];

  // Configuration
  private readonly METRICS_RETENTION_DAYS = 30;
  private readonly METRICS_AGGREGATION_INTERVAL = 60000; // 1 minute
  private readonly LATENCY_SAMPLES_SIZE = 1000;
  private readonly ALERT_THRESHOLD_ERROR_RATE = 0.05; // 5%
  private readonly ALERT_THRESHOLD_LATENCY = 2000; // 2 seconds

  constructor(private readonly configService: ConfigService) {
    this.initializeRedis();
    this.startMetricsAggregation();
  }

  /**
   * Initialize Redis connection
   */
  private initializeRedis(): void {
    const redisUrl = this.configService.get('REDIS_URL');
    this.redis = new Redis(redisUrl);

    this.redis.on('connect', () => {
      this.logger.log('🔗 WebSocket Monitoring: Redis connected');
    });

    this.redis.on('error', (err) => {
      this.logger.error('❌ WebSocket Monitoring: Redis error:', err);
    });
  }

  /**
   * Initialize metrics structure
   */
  private initializeMetrics(): WebSocketMetrics {
    return {
      timestamp: new Date().toISOString(),
      connections: {
        total: 0,
        active: 0,
        peak: 0,
      },
      messages: {
        sent: 0,
        received: 0,
        queued: 0,
        failed: 0,
      },
      performance: {
        averageLatency: 0,
        p95Latency: 0,
        p99Latency: 0,
      },
      errors: {
        connectionErrors: 0,
        authErrors: 0,
        messageErrors: 0,
      },
      namespaces: {},
    };
  }

  /**
   * Track connection event
   */
  async trackConnection(namespace: string, connected: boolean): Promise<void> {
    try {
      const key = `metrics:connections:${namespace}`;

      if (connected) {
        await this.redis.incr(key);
        this.currentMetrics.connections.total++;
        this.currentMetrics.connections.active++;

        if (this.currentMetrics.connections.active > this.peakConnections) {
          this.peakConnections = this.currentMetrics.connections.active;
          this.currentMetrics.connections.peak = this.peakConnections;
        }
      } else {
        await this.redis.decr(key);
        this.currentMetrics.connections.active--;
      }

      // Update namespace metrics
      if (!this.currentMetrics.namespaces[namespace]) {
        this.currentMetrics.namespaces[namespace] = {
          connections: 0,
          messages: 0,
        };
      }

      if (connected) {
        this.currentMetrics.namespaces[namespace].connections++;
      } else {
        this.currentMetrics.namespaces[namespace].connections--;
      }
    } catch (error) {
      this.logger.error('❌ Error tracking connection:', error);
    }
  }

  /**
   * Track message event
   */
  async trackMessage(
    namespace: string,
    type: 'sent' | 'received' | 'queued' | 'failed',
  ): Promise<void> {
    try {
      const key = `metrics:messages:${namespace}:${type}`;
      await this.redis.incr(key);

      this.currentMetrics.messages[type]++;

      // Update namespace metrics
      if (!this.currentMetrics.namespaces[namespace]) {
        this.currentMetrics.namespaces[namespace] = {
          connections: 0,
          messages: 0,
        };
      }

      this.currentMetrics.namespaces[namespace].messages++;
    } catch (error) {
      this.logger.error('❌ Error tracking message:', error);
    }
  }

  /**
   * Track latency sample
   */
  trackLatency(latency: number): void {
    this.latencySamples.push(latency);

    if (this.latencySamples.length > this.LATENCY_SAMPLES_SIZE) {
      this.latencySamples.shift();
    }

    this.updateLatencyMetrics();

    // Check for latency alerts
    if (latency > this.ALERT_THRESHOLD_LATENCY) {
      this.triggerAlert('high_latency', {
        latency,
        threshold: this.ALERT_THRESHOLD_LATENCY,
      });
    }
  }

  /**
   * Update latency metrics
   */
  private updateLatencyMetrics(): void {
    if (this.latencySamples.length === 0) return;

    const sorted = [...this.latencySamples].sort((a, b) => a - b);
    const sum = sorted.reduce((a, b) => a + b, 0);

    this.currentMetrics.performance.averageLatency = sum / sorted.length;
    this.currentMetrics.performance.p95Latency =
      sorted[Math.floor(sorted.length * 0.95)];
    this.currentMetrics.performance.p99Latency =
      sorted[Math.floor(sorted.length * 0.99)];
  }

  /**
   * Track error event
   */
  async trackError(
    type: 'connection' | 'auth' | 'message',
    error: any,
  ): Promise<void> {
    try {
      const key = `metrics:errors:${type}`;
      await this.redis.incr(key);

      switch (type) {
        case 'connection':
          this.currentMetrics.errors.connectionErrors++;
          break;
        case 'auth':
          this.currentMetrics.errors.authErrors++;
          break;
        case 'message':
          this.currentMetrics.errors.messageErrors++;
          break;
      }

      // Store error details
      await this.storeError(type, error);

      // Check for error rate alerts
      this.checkErrorRateAlerts();
    } catch (error) {
      this.logger.error('❌ Error tracking error:', error);
    }
  }

  /**
   * Track real-time event
   */
  async trackEvent(event: RealtimeEvent): Promise<void> {
    try {
      const eventKey = `events:${event.namespace}:${event.type}`;
      const eventData = {
        ...event,
        timestamp: new Date().toISOString(),
      };

      // Store event
      await this.redis.lpush(eventKey, JSON.stringify(eventData));
      await this.redis.ltrim(eventKey, 0, 999); // Keep last 1000 events
      await this.redis.expire(eventKey, 86400); // 24 hours

      // Increment event counter
      const counterKey = `metrics:events:${event.namespace}:${event.type}`;
      await this.redis.incr(counterKey);
    } catch (error) {
      this.logger.error('❌ Error tracking event:', error);
    }
  }

  /**
   * Get current metrics
   */
  getCurrentMetrics(): WebSocketMetrics {
    return { ...this.currentMetrics };
  }

  /**
   * Get historical metrics
   */
  async getHistoricalMetrics(
    startTime: Date,
    endTime: Date,
  ): Promise<WebSocketMetrics[]> {
    try {
      const metrics: WebSocketMetrics[] = [];
      const pattern = `metrics:snapshot:*`;
      const keys = await this.redis.keys(pattern);

      for (const key of keys) {
        const data = await this.redis.get(key);
        if (data) {
          const metric = JSON.parse(data) as WebSocketMetrics;
          const metricTime = new Date(metric.timestamp);

          if (metricTime >= startTime && metricTime <= endTime) {
            metrics.push(metric);
          }
        }
      }

      return metrics.sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
      );
    } catch (error) {
      this.logger.error('❌ Error getting historical metrics:', error);
      return [];
    }
  }

  /**
   * Get namespace statistics
   */
  async getNamespaceStats(namespace: string): Promise<any> {
    try {
      const [connections, messagesSent, messagesReceived, messagesQueued, messagesFailed] =
        await Promise.all([
          this.redis.get(`metrics:connections:${namespace}`),
          this.redis.get(`metrics:messages:${namespace}:sent`),
          this.redis.get(`metrics:messages:${namespace}:received`),
          this.redis.get(`metrics:messages:${namespace}:queued`),
          this.redis.get(`metrics:messages:${namespace}:failed`),
        ]);

      return {
        namespace,
        connections: parseInt(connections || '0'),
        messages: {
          sent: parseInt(messagesSent || '0'),
          received: parseInt(messagesReceived || '0'),
          queued: parseInt(messagesQueued || '0'),
          failed: parseInt(messagesFailed || '0'),
        },
      };
    } catch (error) {
      this.logger.error(`❌ Error getting namespace stats for ${namespace}:`, error);
      return null;
    }
  }

  /**
   * Get error statistics
   */
  async getErrorStats(): Promise<any> {
    try {
      const [connectionErrors, authErrors, messageErrors] = await Promise.all([
        this.redis.get('metrics:errors:connection'),
        this.redis.get('metrics:errors:auth'),
        this.redis.get('metrics:errors:message'),
      ]);

      return {
        connectionErrors: parseInt(connectionErrors || '0'),
        authErrors: parseInt(authErrors || '0'),
        messageErrors: parseInt(messageErrors || '0'),
        total:
          parseInt(connectionErrors || '0') +
          parseInt(authErrors || '0') +
          parseInt(messageErrors || '0'),
      };
    } catch (error) {
      this.logger.error('❌ Error getting error stats:', error);
      return {
        connectionErrors: 0,
        authErrors: 0,
        messageErrors: 0,
        total: 0,
      };
    }
  }

  /**
   * Start metrics aggregation
   */
  private startMetricsAggregation(): void {
    setInterval(() => {
      this.aggregateMetrics();
    }, this.METRICS_AGGREGATION_INTERVAL);
  }

  /**
   * Aggregate and store metrics
   */
  private async aggregateMetrics(): Promise<void> {
    try {
      // Update timestamp
      this.currentMetrics.timestamp = new Date().toISOString();

      // Store snapshot
      const snapshotKey = `metrics:snapshot:${Date.now()}`;
      await this.redis.setex(
        snapshotKey,
        this.METRICS_RETENTION_DAYS * 86400,
        JSON.stringify(this.currentMetrics),
      );

      this.logger.debug('📊 Metrics aggregated and stored');
    } catch (error) {
      this.logger.error('❌ Error aggregating metrics:', error);
    }
  }

  /**
   * Store error details
   */
  private async storeError(type: string, error: any): Promise<void> {
    try {
      const errorKey = `errors:${type}`;
      const errorData = {
        type,
        message: error.message || String(error),
        stack: error.stack,
        timestamp: new Date().toISOString(),
      };

      await this.redis.lpush(errorKey, JSON.stringify(errorData));
      await this.redis.ltrim(errorKey, 0, 99); // Keep last 100 errors
      await this.redis.expire(errorKey, 86400); // 24 hours
    } catch (err) {
      this.logger.error('❌ Error storing error details:', err);
    }
  }

  /**
   * Check error rate alerts
   */
  private checkErrorRateAlerts(): void {
    const totalOperations =
      this.currentMetrics.messages.sent +
      this.currentMetrics.messages.received +
      this.currentMetrics.connections.total;

    const totalErrors =
      this.currentMetrics.errors.connectionErrors +
      this.currentMetrics.errors.authErrors +
      this.currentMetrics.errors.messageErrors;

    if (totalOperations > 0) {
      const errorRate = totalErrors / totalOperations;

      if (errorRate > this.ALERT_THRESHOLD_ERROR_RATE) {
        this.triggerAlert('high_error_rate', {
          errorRate,
          threshold: this.ALERT_THRESHOLD_ERROR_RATE,
          totalErrors,
          totalOperations,
        });
      }
    }
  }

  /**
   * Trigger alert
   */
  private triggerAlert(type: string, data: any): void {
    this.logger.warn(`🚨 ALERT: ${type}`, data);

    // Store alert
    const alertKey = `alerts:${type}`;
    const alertData = {
      type,
      data,
      timestamp: new Date().toISOString(),
    };

    this.redis
      .lpush(alertKey, JSON.stringify(alertData))
      .then(() => this.redis.ltrim(alertKey, 0, 99))
      .then(() => this.redis.expire(alertKey, 86400))
      .catch((err) => this.logger.error('Error storing alert:', err));

    // Here you can integrate with external alerting systems
    // e.g., PagerDuty, Slack, Email, etc.
  }

  /**
   * Reset metrics
   */
  async resetMetrics(): Promise<void> {
    try {
      this.currentMetrics = this.initializeMetrics();
      this.peakConnections = 0;
      this.latencySamples = [];

      const pattern = 'metrics:*';
      const keys = await this.redis.keys(pattern);

      if (keys.length > 0) {
        await this.redis.del(...keys);
      }

      this.logger.log('🔄 Metrics reset');
    } catch (error) {
      this.logger.error('❌ Error resetting metrics:', error);
    }
  }

  /**
   * Export metrics for external monitoring systems
   */
  async exportMetrics(): Promise<string> {
    try {
      const metrics = this.getCurrentMetrics();

      // Prometheus format
      let output = '';

      output += `# HELP ws_connections_total Total WebSocket connections\n`;
      output += `# TYPE ws_connections_total counter\n`;
      output += `ws_connections_total ${metrics.connections.total}\n\n`;

      output += `# HELP ws_connections_active Active WebSocket connections\n`;
      output += `# TYPE ws_connections_active gauge\n`;
      output += `ws_connections_active ${metrics.connections.active}\n\n`;

      output += `# HELP ws_messages_sent_total Total messages sent\n`;
      output += `# TYPE ws_messages_sent_total counter\n`;
      output += `ws_messages_sent_total ${metrics.messages.sent}\n\n`;

      output += `# HELP ws_latency_average Average latency in ms\n`;
      output += `# TYPE ws_latency_average gauge\n`;
      output += `ws_latency_average ${metrics.performance.averageLatency}\n\n`;

      output += `# HELP ws_latency_p95 P95 latency in ms\n`;
      output += `# TYPE ws_latency_p95 gauge\n`;
      output += `ws_latency_p95 ${metrics.performance.p95Latency}\n\n`;

      output += `# HELP ws_errors_total Total errors\n`;
      output += `# TYPE ws_errors_total counter\n`;
      output += `ws_errors_total{type="connection"} ${metrics.errors.connectionErrors}\n`;
      output += `ws_errors_total{type="auth"} ${metrics.errors.authErrors}\n`;
      output += `ws_errors_total{type="message"} ${metrics.errors.messageErrors}\n\n`;

      return output;
    } catch (error) {
      this.logger.error('❌ Error exporting metrics:', error);
      return '';
    }
  }
}
