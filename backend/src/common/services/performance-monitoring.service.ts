import { Injectable, Logger } from '@nestjs/common';
import { performance } from 'perf_hooks';

interface PerformanceStats {
  count: number;
  min: number;
  max: number;
  avg: number;
  p50: number;
  p95: number;
  p99: number;
}

/**
 * Service for monitoring and tracking performance metrics
 * Tracks response times, query times, and generates performance reports
 */
@Injectable()
export class PerformanceMonitoringService {
  private readonly logger = new Logger(PerformanceMonitoringService.name);
  private metrics: Map<string, number[]> = new Map();
  private activeOperations: Map<string, number> = new Map();
  private memorySnapshots: Array<{ timestamp: number; heapUsed: number }> = [];
  private readonly MAX_METRICS = 10000; // Keep last 10k metrics per operation

  /**
   * Start tracking a performance operation
   */
  startOperation(operationName: string): string {
    const operationId = `${operationName}-${Date.now()}-${Math.random()}`;
    this.activeOperations.set(operationId, performance.now());
    return operationId;
  }

  /**
   * End tracking a performance operation
   */
  endOperation(operationId: string, metadata?: Record<string, any>): number {
    const startTime = this.activeOperations.get(operationId);
    if (!startTime) {
      this.logger.warn(`Operation ${operationId} not found`);
      return 0;
    }

    const duration = performance.now() - startTime;
    this.activeOperations.delete(operationId);

    // Extract operation name
    const operationName = operationId.split('-')[0];
    this.recordMetric(operationName, duration, metadata);

    return duration;
  }

  /**
   * Record a metric value
   */
  private recordMetric(
    name: string,
    duration: number,
    metadata?: Record<string, any>,
  ): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }

    const metrics = this.metrics.get(name);
    metrics.push(duration);

    // Keep only last N metrics to prevent memory issues
    if (metrics.length > this.MAX_METRICS) {
      metrics.shift();
    }

    // Log slow operations (> 1 second)
    if (duration > 1000) {
      this.logger.warn(
        `Slow operation detected: ${name} took ${duration.toFixed(2)}ms`,
        metadata,
      );
    }
  }

  /**
   * Get performance statistics for an operation
   */
  getStats(operationName: string): PerformanceStats | null {
    const metrics = this.metrics.get(operationName);
    if (!metrics || metrics.length === 0) {
      return null;
    }

    const sorted = [...metrics].sort((a, b) => a - b);
    const count = sorted.length;

    return {
      count,
      min: sorted[0],
      max: sorted[count - 1],
      avg: sorted.reduce((a, b) => a + b, 0) / count,
      p50: sorted[Math.floor(count * 0.5)],
      p95: sorted[Math.floor(count * 0.95)],
      p99: sorted[Math.floor(count * 0.99)],
    };
  }

  /**
   * Get all performance statistics
   */
  getAllStats(): Record<string, PerformanceStats> {
    const stats: Record<string, PerformanceStats> = {};

    for (const [name] of this.metrics) {
      const stat = this.getStats(name);
      if (stat) {
        stats[name] = stat;
      }
    }

    return stats;
  }

  /**
   * Take a memory snapshot
   */
  takeMemorySnapshot(): void {
    const memUsage = process.memoryUsage();
    this.memorySnapshots.push({
      timestamp: Date.now(),
      heapUsed: memUsage.heapUsed,
    });

    // Keep only last 1000 snapshots (about 16 minutes at 1 per second)
    if (this.memorySnapshots.length > 1000) {
      this.memorySnapshots.shift();
    }

    // Detect memory leaks (growing heap over 5 minutes)
    if (this.memorySnapshots.length >= 300) {
      const recent = this.memorySnapshots.slice(-300);
      const first = recent[0].heapUsed;
      const last = recent[recent.length - 1].heapUsed;
      const growth = ((last - first) / first) * 100;

      if (growth > 50) {
        this.logger.error(
          `Potential memory leak detected: ${growth.toFixed(2)}% growth in 5 minutes`,
        );
      }
    }
  }

  /**
   * Get memory usage information
   */
  getMemoryUsage(): {
    current: NodeJS.MemoryUsage;
    trend: number;
    potential_leak: boolean;
  } {
    const current = process.memoryUsage();

    if (this.memorySnapshots.length < 2) {
      return {
        current,
        trend: 0,
        potential_leak: false,
      };
    }

    const recent = this.memorySnapshots.slice(-60); // Last minute
    const first = recent[0].heapUsed;
    const last = recent[recent.length - 1].heapUsed;
    const trend = ((last - first) / first) * 100;

    return {
      current,
      trend,
      potential_leak: trend > 20,
    };
  }

  /**
   * Get CPU usage information
   */
  getCpuUsage(): {
    user: number;
    system: number;
  } {
    const usage = process.cpuUsage();
    return {
      user: usage.user / 1000000, // Convert to seconds
      system: usage.system / 1000000,
    };
  }

  /**
   * Get active operations count
   */
  getActiveOperationsCount(): number {
    return this.activeOperations.size;
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metrics.clear();
    this.activeOperations.clear();
    this.memorySnapshots = [];
  }

  /**
   * Generate performance report
   */
  generateReport(): {
    operations: Record<string, PerformanceStats>;
    memory: ReturnType<typeof this.getMemoryUsage>;
    cpu: ReturnType<typeof this.getCpuUsage>;
    activeOperations: number;
  } {
    return {
      operations: this.getAllStats(),
      memory: this.getMemoryUsage(),
      cpu: this.getCpuUsage(),
      activeOperations: this.getActiveOperationsCount(),
    };
  }
}
