import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class TokenService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generate a secure refresh token
   */
  generateRefreshToken(): string {
    return crypto.randomBytes(64).toString('hex');
  }

  /**
   * Store refresh token in database
   */
  async storeRefreshToken(
    userId: string,
    token: string,
    deviceInfo?: string,
    ipAddress?: string,
  ) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

    return this.prisma.refreshToken.create({
      data: {
        token,
        userId,
        expiresAt,
        deviceInfo,
        ipAddress,
      },
    });
  }

  /**
   * Validate and find refresh token
   */
  async validateRefreshToken(token: string) {
    return this.prisma.refreshToken.findFirst({
      where: {
        token,
        isRevoked: false,
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        user: true,
      },
    });
  }

  /**
   * Revoke refresh token
   */
  async revokeRefreshToken(token: string) {
    return this.prisma.refreshToken.update({
      where: { token },
      data: { isRevoked: true },
    });
  }

  /**
   * Revoke all user refresh tokens (logout from all devices)
   */
  async revokeAllUserTokens(userId: string) {
    return this.prisma.refreshToken.updateMany({
      where: { userId },
      data: { isRevoked: true },
    });
  }

  /**
   * Clean up expired tokens
   */
  async cleanupExpiredTokens() {
    return this.prisma.refreshToken.deleteMany({
      where: {
        OR: [{ expiresAt: { lt: new Date() } }, { isRevoked: true }],
      },
    });
  }
}
