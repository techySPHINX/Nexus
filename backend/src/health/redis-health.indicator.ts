import { Injectable } from '@nestjs/common';
import {
  HealthIndicator,
  HealthIndicatorResult,
  HealthCheckError,
} from '@nestjs/terminus';
import { RedisService } from '../common/services/redis.service';

/**
 * Custom health indicator that pings Redis using the shared RedisService.
 * This reuses the existing connection pool rather than opening a new connection.
 */
@Injectable()
export class RedisHealthIndicator extends HealthIndicator {
  constructor(private readonly redisService: RedisService) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      const client = this.redisService.getClient();
      const result = await client.ping();
      if (result !== 'PONG') {
        throw new Error(`Unexpected Redis PING response: ${result}`);
      }
      return this.getStatus(key, true, { status: 'PONG' });
    } catch (error) {
      throw new HealthCheckError(
        'Redis health check failed',
        this.getStatus(key, false, {
          message: (error as Error).message,
        }),
      );
    }
  }
}
