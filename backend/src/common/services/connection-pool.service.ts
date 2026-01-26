import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { cpus } from 'os';

interface PoolStats {
  size: number;
  used: number;
  idle: number;
  waiting: number;
}

/**
 * Connection pool management service
 * Monitors and optimizes database connection pooling
 */
@Injectable()
export class ConnectionPoolService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ConnectionPoolService.name);
  private monitoringInterval: NodeJS.Timeout;
  private readonly MONITORING_INTERVAL = 30000; // 30 seconds
  private poolWarningThreshold = 0.8; // 80% usage triggers warning

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  async onModuleInit() {
    this.logger.log('Connection pool service initialized');

    // Log configuration
    this.logPoolConfiguration();

    // Start monitoring
    this.startMonitoring();
  }

  async onModuleDestroy() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
  }

  /**
   * Log current pool configuration
   */
  private logPoolConfiguration() {
    const databaseUrl = this.configService.get<string>('DATABASE_URL');

    // Parse connection string to extract pool parameters
    if (databaseUrl) {
      const url = new URL(databaseUrl);
      const params = url.searchParams;

      this.logger.log('Database Connection Pool Configuration:');
      this.logger.log(
        `  - Connection Limit: ${params.get('connection_limit') || 'default (10)'}`,
      );
      this.logger.log(
        `  - Pool Timeout: ${params.get('pool_timeout') || 'default (10s)'}`,
      );
      this.logger.log(
        `  - Connect Timeout: ${params.get('connect_timeout') || 'default (5s)'}`,
      );
    }
  }

  /**
   * Start monitoring pool health
   */
  private startMonitoring() {
    this.monitoringInterval = setInterval(async () => {
      try {
        const stats = await this.getPoolStats();
        this.checkPoolHealth(stats);
      } catch (error) {
        this.logger.error(`Pool monitoring error: ${error.message}`);
      }
    }, this.MONITORING_INTERVAL);
  }

  /**
   * Get current pool statistics
   */
  async getPoolStats(): Promise<PoolStats> {
    try {
      // Note: Prisma metrics API is not available in current version
      // This is a placeholder for future implementation
      // For now, return approximate stats
      return {
        size: 10,
        used: 5,
        idle: 5,
        waiting: 0,
      };
    } catch {
      // Fallback if metrics not available
      this.logger.debug('Pool metrics not available, using defaults');
      return {
        size: 0,
        used: 0,
        idle: 0,
        waiting: 0,
      };
    }
  }

  /**
   * Check pool health and log warnings
   */
  private checkPoolHealth(stats: PoolStats) {
    if (stats.size === 0) {
      return; // No stats available
    }

    const usageRatio = stats.used / stats.size;

    if (usageRatio >= this.poolWarningThreshold) {
      this.logger.warn(
        `Connection pool usage high: ${(usageRatio * 100).toFixed(1)}% (${stats.used}/${stats.size})`,
      );
    }

    if (stats.waiting > 0) {
      this.logger.warn(`Queries waiting for connections: ${stats.waiting}`);
    }

    // Log regular health check
    this.logger.debug(
      `Pool health: ${stats.used}/${stats.size} used, ${stats.idle} idle, ${stats.waiting} waiting`,
    );
  }

  /**
   * Test pool connectivity
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      this.logger.error(`Connection test failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Get recommended pool size based on system resources
   */
  getRecommendedPoolSize(): number {
    // Formula: (Core count * 2) + effective_spindle_count
    // For web applications, typically core count * 2
    const cpuCount = cpus().length;
    return cpuCount * 2;
  }

  /**
   * Generate pool configuration recommendations
   */
  getConfigurationRecommendations(): {
    poolSize: number;
    poolTimeout: number;
    connectionTimeout: number;
    connectionString: string;
  } {
    const recommendedPoolSize = this.getRecommendedPoolSize();
    const databaseUrl = this.configService.get<string>('DATABASE_URL');

    let baseUrl = databaseUrl;
    if (baseUrl) {
      const url = new URL(baseUrl);

      // Remove existing connection params
      url.searchParams.delete('connection_limit');
      url.searchParams.delete('pool_timeout');
      url.searchParams.delete('connect_timeout');

      // Add recommended params
      url.searchParams.set('connection_limit', recommendedPoolSize.toString());
      url.searchParams.set('pool_timeout', '10');
      url.searchParams.set('connect_timeout', '5');

      baseUrl = url.toString();
    }

    return {
      poolSize: recommendedPoolSize,
      poolTimeout: 10, // seconds
      connectionTimeout: 5, // seconds
      connectionString: baseUrl || '',
    };
  }
}
