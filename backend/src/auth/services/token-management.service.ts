import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RedisService } from '../../common/services/redis.service';
import { WinstonLoggerService } from '../../common/logger/winston-logger.service';
import { AuditLogService, AuditAction } from '../../common/services/audit-log.service';
import * as crypto from 'crypto';

interface TokenPayload {
  sub: string;
  email: string;
  role: string;
  tokenVersion?: number;
}

@Injectable()
export class TokenManagementService {
  private readonly ACCESS_TOKEN_PREFIX = 'access_token:';
  private readonly REFRESH_TOKEN_PREFIX = 'refresh_token:';
  private readonly BLACKLIST_PREFIX = 'blacklist:';
  private readonly TOKEN_VERSION_PREFIX = 'token_version:';

  constructor(
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService,
    private readonly logger: WinstonLoggerService,
    private readonly auditLog: AuditLogService,
  ) { }

  /**
   * Generate access and refresh tokens
   */
  async generateTokens(
    userId: string,
    email: string,
    role: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const tokenVersion = await this.getTokenVersion(userId);

    const payload: TokenPayload = {
      sub: userId,
      email,
      role,
      tokenVersion,
    };

    const accessTokenExpiry = process.env.JWT_ACCESS_EXPIRY || '15m';
    const refreshTokenExpiry = process.env.JWT_REFRESH_EXPIRY || '7d';

    // Generate tokens
    const accessToken = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET,
      expiresIn: accessTokenExpiry,
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
      expiresIn: refreshTokenExpiry,
    });

    // Store refresh token in Redis (hash of token for security)
    const refreshTokenHash = this.hashToken(refreshToken);
    const refreshTokenTTL = this.parseTTL(refreshTokenExpiry);
    await this.redisService.set(
      `${this.REFRESH_TOKEN_PREFIX}${userId}`,
      refreshTokenHash,
      refreshTokenTTL,
    );

    this.logger.log(`Tokens generated for user ${userId}`, 'TokenManagementService');

    return { accessToken, refreshToken };
  }

  /**
   * Verify and refresh tokens
   */
  async refreshTokens(
    refreshToken: string,
    request: any,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      // Verify refresh token
      const payload = await this.jwtService.verifyAsync<TokenPayload>(
        refreshToken,
        {
          secret: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
        },
      );

      // Check if token is blacklisted
      const isBlacklisted = await this.isTokenBlacklisted(refreshToken);
      if (isBlacklisted) {
        this.logger.warn(
          `Blacklisted refresh token used by user ${payload.sub}`,
          'TokenManagementService',
        );
        throw new UnauthorizedException('Token has been revoked');
      }

      // Verify token version
      const currentVersion = await this.getTokenVersion(payload.sub);
      if (payload.tokenVersion !== currentVersion) {
        this.logger.warn(
          `Invalid token version for user ${payload.sub}`,
          'TokenManagementService',
        );
        throw new UnauthorizedException('Token version mismatch');
      }

      // Verify stored refresh token hash
      const storedHash = await this.redisService.get(
        `${this.REFRESH_TOKEN_PREFIX}${payload.sub}`,
      );
      const providedHash = this.hashToken(refreshToken);

      if (storedHash !== providedHash) {
        this.logger.warn(
          `Refresh token mismatch for user ${payload.sub}`,
          'TokenManagementService',
        );
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Blacklist old refresh token
      await this.blacklistToken(refreshToken, '7d');

      // Generate new tokens (refresh token rotation)
      const newTokens = await this.generateTokens(
        payload.sub,
        payload.email,
        payload.role,
      );

      // Audit log
      await this.auditLog.logAuth(
        AuditAction.TOKEN_REFRESH,
        payload.sub,
        request.ip || 'unknown',
        request.headers?.['user-agent'] || 'unknown',
        'success',
      );

      this.logger.log(
        `Tokens refreshed for user ${payload.sub}`,
        'TokenManagementService',
      );

      return newTokens;
    } catch (error) {
      this.logger.error(
        'Token refresh failed',
        error.stack,
        'TokenManagementService',
      );
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  /**
   * Revoke all tokens for a user
   */
  async revokeAllTokens(userId: string): Promise<void> {
    // Increment token version to invalidate all existing tokens
    await this.incrementTokenVersion(userId);

    // Delete refresh token
    await this.redisService.del(`${this.REFRESH_TOKEN_PREFIX}${userId}`);

    this.logger.warn(
      `All tokens revoked for user ${userId}`,
      'TokenManagementService',
    );
  }

  /**
   * Blacklist a token
   */
  async blacklistToken(token: string, ttl: string): Promise<void> {
    const tokenHash = this.hashToken(token);
    const ttlSeconds = this.parseTTL(ttl);
    await this.redisService.set(
      `${this.BLACKLIST_PREFIX}${tokenHash}`,
      'true',
      ttlSeconds,
    );
  }

  /**
   * Check if token is blacklisted
   */
  async isTokenBlacklisted(token: string): Promise<boolean> {
    const tokenHash = this.hashToken(token);
    return this.redisService.exists(`${this.BLACKLIST_PREFIX}${tokenHash}`);
  }

  /**
   * Get token version for a user
   */
  async getTokenVersion(userId: string): Promise<number> {
    const version = await this.redisService.get(
      `${this.TOKEN_VERSION_PREFIX}${userId}`,
    );
    return version ? parseInt(version) : 0;
  }

  /**
   * Increment token version (invalidates all tokens)
   */
  async incrementTokenVersion(userId: string): Promise<number> {
    const newVersion = await this.redisService.incr(
      `${this.TOKEN_VERSION_PREFIX}${userId}`,
    );
    return newVersion;
  }

  /**
   * Verify access token
   */
  async verifyAccessToken(token: string): Promise<TokenPayload> {
    try {
      const payload = await this.jwtService.verifyAsync<TokenPayload>(token, {
        secret: process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET,
      });

      // Check if blacklisted
      const isBlacklisted = await this.isTokenBlacklisted(token);
      if (isBlacklisted) {
        throw new UnauthorizedException('Token has been revoked');
      }

      // Verify token version
      const currentVersion = await this.getTokenVersion(payload.sub);
      if (payload.tokenVersion !== currentVersion) {
        throw new UnauthorizedException('Token version mismatch');
      }

      return payload;
    } catch {
      throw new UnauthorizedException('Invalid access token');
    }
  }

  /**
   * Hash token for storage
   */
  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Parse TTL string to seconds
   */
  private parseTTL(ttl: string): number {
    const unit = ttl.slice(-1);
    const value = parseInt(ttl.slice(0, -1));

    switch (unit) {
      case 's':
        return value;
      case 'm':
        return value * 60;
      case 'h':
        return value * 60 * 60;
      case 'd':
        return value * 24 * 60 * 60;
      default:
        return 900; // Default 15 minutes
    }
  }

  /**
   * Cleanup expired blacklisted tokens (called by cron job)
   */
  async cleanupBlacklist(): Promise<number> {
    // Redis automatically removes expired keys, but we can clean up manually if needed
    const keys = await this.redisService
      .getClient()
      .keys(`${this.BLACKLIST_PREFIX}*`);
    let cleaned = 0;

    for (const key of keys) {
      const ttl = await this.redisService.ttl(key);
      if (ttl === -1 || ttl === -2) {
        await this.redisService.del(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      this.logger.log(
        `Cleaned up ${cleaned} expired blacklist entries`,
        'TokenManagementService',
      );
    }

    return cleaned;
  }
}
