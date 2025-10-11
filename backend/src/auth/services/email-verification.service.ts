import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '../../email/email.service';
import * as crypto from 'crypto';

@Injectable()
export class EmailVerificationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  /**
   * Generate and send email verification token
   */
  async sendVerificationEmail(email: string, name: string) {
    const token = this.generateVerificationToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours

    // Store verification token
    await this.prisma.emailVerification.create({
      data: {
        email,
        token,
        expiresAt,
      },
    });

    // Send verification email
    await this.emailService.sendVerificationEmail(email, name, token);

    return { message: 'Verification email sent successfully' };
  }

  /**
   * Verify email with token
   */
  async verifyEmail(token: string) {
    const verification = await this.prisma.emailVerification.findFirst({
      where: {
        token,
        isUsed: false,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (!verification) {
      throw new Error('Invalid or expired verification token');
    }

    // Mark token as used
    await this.prisma.emailVerification.update({
      where: { id: verification.id },
      data: { isUsed: true },
    });

    // Update user's email verification status
    await this.prisma.user.update({
      where: { email: verification.email },
      data: { isEmailVerified: true },
    });

    return { message: 'Email verified successfully' };
  }

  /**
   * Generate secure verification token
   */
  private generateVerificationToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Clean up expired verification tokens
   */
  async cleanupExpiredTokens() {
    return this.prisma.emailVerification.deleteMany({
      where: {
        OR: [{ expiresAt: { lt: new Date() } }, { isUsed: true }],
      },
    });
  }
}
