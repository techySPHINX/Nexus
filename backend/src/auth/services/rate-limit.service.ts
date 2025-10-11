import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class RateLimitService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly MAX_LOGIN_ATTEMPTS = 5;
  private readonly LOCKOUT_DURATION = 30 * 60 * 1000; // 30 minutes

  /**
   * Record login attempt
   */
  async recordLoginAttempt(
    email: string,
    ipAddress: string,
    userAgent: string,
    success: boolean,
  ) {
    await this.prisma.loginAttempt.create({
      data: {
        email,
        ipAddress,
        userAgent,
        success,
      },
    });

    if (!success) {
      await this.handleFailedLogin(email);
    }
  }

  /**
   * Check if account should be locked
   */
  async isAccountLocked(email: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: { lockedUntil: true },
    });

    if (user?.lockedUntil && user.lockedUntil > new Date()) {
      return true;
    }

    return false;
  }

  /**
   * Handle failed login attempt
   */
  private async handleFailedLogin(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true, failedLoginAttempts: true },
    });

    if (!user) return;

    const newAttempts = (user.failedLoginAttempts || 0) + 1;

    if (newAttempts >= this.MAX_LOGIN_ATTEMPTS) {
      const lockedUntil = new Date(Date.now() + this.LOCKOUT_DURATION);

      await this.prisma.user.update({
        where: { email },
        data: {
          failedLoginAttempts: newAttempts,
          lockedUntil,
        },
      });

      // Log security event
      await this.logSecurityEvent(
        user.id,
        'ACCOUNT_LOCKED',
        'Account locked due to too many failed login attempts',
      );
    } else {
      await this.prisma.user.update({
        where: { email },
        data: {
          failedLoginAttempts: newAttempts,
        },
      });
    }
  }

  /**
   * Reset failed login attempts on successful login
   */
  async resetFailedAttempts(email: string) {
    await this.prisma.user.update({
      where: { email },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
      },
    });
  }

  /**
   * Log security event
   */
  private async logSecurityEvent(
    userId: string,
    eventType: string,
    metadata: any,
  ) {
    await this.prisma.securityEvent.create({
      data: {
        userId,
        eventType: eventType as any,
        ipAddress: 'system',
        metadata,
      },
    });
  }

  /**
   * Get recent failed attempts for IP
   */
  async getRecentFailedAttempts(ipAddress: string): Promise<number> {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const attempts = await this.prisma.loginAttempt.count({
      where: {
        ipAddress,
        success: false,
        createdAt: {
          gte: oneHourAgo,
        },
      },
    });

    return attempts;
  }

  /**
   * Check if IP should be rate limited
   */
  async isIpRateLimited(ipAddress: string): Promise<boolean> {
    const attempts = await this.getRecentFailedAttempts(ipAddress);
    return attempts >= 10; // 10 failed attempts per hour
  }
}
