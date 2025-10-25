import { Injectable, ExecutionContext } from '@nestjs/common';
import { RedisService } from '../../common/services/redis.service';
import { WinstonLoggerService } from '../../common/logger/winston-logger.service';
import { AuditLogService, AuditAction } from '../../common/services/audit-log.service';

export interface RateLimitConfig {
  ttl: number; // Time window in seconds
  limit: number; // Max requests in window
}

@Injectable()
export class EnhancedRateLimitGuard {
  constructor(
    private readonly redisService: RedisService,
    private readonly logger: WinstonLoggerService,
    private readonly auditLog: AuditLogService,
  ) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.sub;
    const ip = request.ip || request.connection.remoteAddress;
    const endpoint = request.route?.path || request.url;

    // Check IP-based rate limit
    const ipAllowed = await this.checkRateLimit(
      `ip:${ip}`,
      endpoint,
      this.getEndpointConfig(endpoint),
    );

    if (!ipAllowed) {
      await this.logRateLimitExceeded(null, ip, endpoint, request);
      return false;
    }

    // Check user-based rate limit if authenticated
    if (userId) {
      const userAllowed = await this.checkRateLimit(
        `user:${userId}`,
        endpoint,
        this.getEndpointConfig(endpoint),
      );

      if (!userAllowed) {
        await this.logRateLimitExceeded(userId, ip, endpoint, request);
        return false;
      }
    }

    return true;
  }

  /**
   * Check rate limit using Redis
   */
  private async checkRateLimit(
    identifier: string,
    endpoint: string,
    config: RateLimitConfig,
  ): Promise<boolean> {
    const key = `rate_limit:${identifier}:${endpoint}`;
    const current = await this.redisService.incr(key);

    if (current === 1) {
      // First request in window, set expiry
      await this.redisService.expire(key, config.ttl);
    }

    if (current > config.limit) {
      this.logger.warn(
        `Rate limit exceeded for ${identifier} on ${endpoint}`,
        'EnhancedRateLimitGuard',
      );
      return false;
    }

    return true;
  }

  /**
   * Get rate limit config for endpoint
   */
  private getEndpointConfig(endpoint: string): RateLimitConfig {
    // Sensitive endpoints have stricter limits
    if (this.isSensitiveEndpoint(endpoint)) {
      return {
        ttl: parseInt(process.env.AUTH_RATE_LIMIT_TTL || '60'),
        limit: parseInt(process.env.AUTH_RATE_LIMIT_MAX || '5'),
      };
    }

    // Default rate limit
    return {
      ttl: parseInt(process.env.RATE_LIMIT_TTL || '60'),
      limit: parseInt(process.env.RATE_LIMIT_MAX || '100'),
    };
  }

  /**
   * Check if endpoint is sensitive
   */
  private isSensitiveEndpoint(endpoint: string): boolean {
    const sensitivePatterns = [
      '/auth/login',
      '/auth/register',
      '/auth/forgot-password',
      '/auth/reset-password',
      '/auth/verify-email',
      '/user/gdpr/export',
      '/user/gdpr/delete-account',
      '/admin',
    ];

    return sensitivePatterns.some((pattern) => endpoint.includes(pattern));
  }

  /**
   * Log rate limit exceeded event
   */
  private async logRateLimitExceeded(
    userId: string | null,
    ip: string,
    endpoint: string,
    request: any,
  ): Promise<void> {
    this.logger.warn(
      `Rate limit exceeded - User: ${userId || 'anonymous'}, IP: ${ip}, Endpoint: ${endpoint}`,
      'EnhancedRateLimitGuard',
    );

    if (userId) {
      await this.auditLog.logAuth(
        AuditAction.RATE_LIMIT_EXCEEDED,
        userId,
        ip,
        request.headers?.['user-agent'] || 'unknown',
        'failure',
        `Endpoint: ${endpoint}`,
      );
    }
  }
}

/**
 * Service for programmatic rate limit checking
 */
@Injectable()
export class RateLimitService {
  constructor(
    private readonly redisService: RedisService,
    private readonly logger: WinstonLoggerService,
  ) { }

  /**
   * Check if action is allowed for user
   */
  async isAllowed(
    userId: string,
    action: string,
    config: RateLimitConfig = { ttl: 60, limit: 10 },
  ): Promise<boolean> {
    const key = `action_limit:${userId}:${action}`;
    const current = await this.redisService.incr(key);

    if (current === 1) {
      await this.redisService.expire(key, config.ttl);
    }

    if (current > config.limit) {
      this.logger.warn(
        `Action rate limit exceeded for user ${userId}, action: ${action}`,
        'RateLimitService',
      );
      return false;
    }

    return true;
  }

  /**
   * Check if action is allowed for IP
   */
  async isAllowedByIP(
    ip: string,
    action: string,
    config: RateLimitConfig = { ttl: 60, limit: 10 },
  ): Promise<boolean> {
    const key = `action_limit:ip:${ip}:${action}`;
    const current = await this.redisService.incr(key);

    if (current === 1) {
      await this.redisService.expire(key, config.ttl);
    }

    if (current > config.limit) {
      this.logger.warn(
        `Action rate limit exceeded for IP ${ip}, action: ${action}`,
        'RateLimitService',
      );
      return false;
    }

    return true;
  }

  /**
   * Reset rate limit for user
   */
  async resetUserLimit(userId: string, action: string): Promise<void> {
    const key = `action_limit:${userId}:${action}`;
    await this.redisService.del(key);
  }

  /**
   * Get remaining requests for user
   */
  async getRemainingRequests(
    userId: string,
    action: string,
    limit: number,
  ): Promise<number> {
    const key = `action_limit:${userId}:${action}`;
    const current = parseInt((await this.redisService.get(key)) || '0');
    return Math.max(0, limit - current);
  }

  /**
   * Get time until rate limit resets
   */
  async getResetTime(userId: string, action: string): Promise<number> {
    const key = `action_limit:${userId}:${action}`;
    const ttl = await this.redisService.ttl(key);
    return ttl > 0 ? ttl : 0;
  }
}
