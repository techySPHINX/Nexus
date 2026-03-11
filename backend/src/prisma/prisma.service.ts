import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ConfigService } from '@nestjs/config';

/**
 * Service for interacting with the Prisma database client.
 * Extends PrismaClient to manage database connections throughout the application lifecycle.
 * Configured with production-grade connection pooling settings.
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor(private configService: ConfigService) {
    const connectionLimit = parseInt(
      process.env.DATABASE_CONNECTION_LIMIT || '2',
      10,
    );
    const poolTimeout = parseInt(process.env.DATABASE_POOL_TIMEOUT || '30', 10);

    // Construct DATABASE_URL with connection pooling parameters
    const baseUrl = process.env.DATABASE_URL || '';
    const separator = baseUrl.includes('?') ? '&' : '?';
    const pooledUrl = `${baseUrl}${separator}connection_limit=${connectionLimit}&pool_timeout=${poolTimeout}`;

    super({
      datasources: {
        db: {
          url: pooledUrl,
        },
      },
      log:
        process.env.NODE_ENV === 'development'
          ? [
              { emit: 'event', level: 'query' },
              { emit: 'event', level: 'info' },
              { emit: 'event', level: 'warn' },
              { emit: 'event', level: 'error' },
            ]
          : [
              { emit: 'event', level: 'error' },
              { emit: 'event', level: 'warn' },
            ],
      errorFormat: 'pretty',
    });

    // Log connection pool configuration
    this.logger.log(
      `📊 Database connection pool configured: ${connectionLimit} connections, ${poolTimeout}s timeout`,
    );
  }

  private getRetryConfig() {
    const maxRetries = parseInt(
      this.configService.get<string>('DATABASE_CONNECT_RETRIES') || '5',
      10,
    );
    const retryDelayMs = parseInt(
      this.configService.get<string>('DATABASE_CONNECT_RETRY_DELAY_MS') ||
        '1500',
      10,
    );

    return {
      maxRetries: Math.max(1, maxRetries),
      retryDelayMs: Math.max(250, retryDelayMs),
    };
  }

  private async wait(ms: number) {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Connects to the database when the module is initialized.
   */
  async onModuleInit() {
    const { maxRetries, retryDelayMs } = this.getRetryConfig();

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await this.$connect();

      // Test database connectivity with a simple query
        await this.$queryRaw`SELECT 1`;

      this.logger.log('✅ Database connected successfully');
        this.logger.log('✅ Database connectivity test passed');

      // Set up event listeners for production monitoring
        this.$on('query' as never, (e: any) => {
          if (process.env.NODE_ENV === 'development') {
            this.logger.debug(`Query: ${e.query} | Duration: ${e.duration}ms`);
          }
        });

        this.$on('error' as never, (e: any) => {
          this.logger.error('Database error:', e);
        });

        this.$on('warn' as never, (e: any) => {
          this.logger.warn('Database warning:', e);
        });

        return;
      } catch (error) {
        const errorMessage =
          error?.message || 'Unknown database connection error';

        if (attempt === maxRetries) {
          this.logger.error(
            `❌ Failed to connect to database after ${maxRetries} attempts: ${errorMessage}`,
          );
          throw error;
        }

        const backoffMs = retryDelayMs * attempt;
        this.logger.warn(
          `⚠️ Database connection attempt ${attempt}/${maxRetries} failed: ${errorMessage}. Retrying in ${backoffMs}ms...`,
        );

        await this.wait(backoffMs);
      }
    }
  }

  /**
   * Disconnects from the database when the module is destroyed.
   */
  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('📊 Database connection closed');
  }

  /**
   * Enable query logging for debugging
   */
  enableQueryLogging() {
    this.$on('query' as never, (e: any) => {
      this.logger.debug(`Query: ${e.query} | Duration: ${e.duration}ms`);
    });
  }

  /**
   * Clean disconnection helper
   */
  async cleanDisconnect() {
    await this.$disconnect();
    this.logger.log('Database connection closed cleanly');
  }

  /**
   * Health check - verify database connectivity
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      this.logger.error('Database health check failed:', error.message);
      return false;
    }
  }

  /**
   * Get connection pool metrics
   */
  async getPoolMetrics() {
    try {
      const result = await this.$queryRaw<any[]>`
        SELECT 
          numbackends as active_connections,
          max_conn as max_connections
        FROM pg_stat_database 
        WHERE datname = current_database()
      `;
      return result[0] || { active_connections: 0, max_connections: 0 };
    } catch (error) {
      this.logger.error('Failed to get pool metrics:', error.message);
      return { active_connections: 0, max_connections: 0 };
    }
  }
}