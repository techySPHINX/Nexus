import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '../../email/email.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

@Injectable()
export class DocumentVerificationService {
  private readonly logger = new Logger(DocumentVerificationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) { }

  /**
   * Submit documents for verification
   */
  async submitDocuments(
    userId: string,
    documents: Array<{ documentType: string; documentUrl: string }>,
  ) {
    if (!documents || documents.length === 0) {
      throw new BadRequestException('At least one document is required');
    }

    const documentRecords = documents.map((doc) => ({
      userId,
      documentType: doc.documentType as any,
      documentUrl: doc.documentUrl,
    }));

    try {
      await this.prisma.verificationDocument.createMany({
        data: documentRecords,
      });

      // Update user account status
      await this.prisma.user.update({
        where: { id: userId },
        data: { accountStatus: 'PENDING_DOCUMENT_REVIEW' as any },
      });

      this.logger.log(
        `📄 Documents submitted for user ${userId} - Count: ${documents.length}`,
      );

      return { message: 'Documents submitted successfully for review' };
    } catch (error) {
      this.logger.error('Failed to submit documents:', error);
      throw new BadRequestException('Failed to submit documents for review');
    }
  }

  /**
   * Get pending documents for admin review
   */
  async getPendingDocuments() {
    return this.prisma.verificationDocument.findMany({
      where: { status: 'PENDING' },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            createdAt: true,
          },
        },
      },
      orderBy: { submittedAt: 'asc' },
    });
  }

  /**
   * Approve user documents with transaction support
   */
  async approveDocuments(
    documentIds: string[],
    adminId: string,
    adminComments?: string,
  ) {
    if (!documentIds || documentIds.length === 0) {
      throw new BadRequestException('Document IDs are required');
    }

    const documents = await this.prisma.verificationDocument.findMany({
      where: { id: { in: documentIds } },
      include: { user: true },
    });

    if (documents.length === 0) {
      throw new BadRequestException('Documents not found');
    }

    // Validate all documents belong to the same user
    const userId = documents[0].userId;
    const allSameUser = documents.every((doc) => doc.userId === userId);
    if (!allSameUser) {
      throw new BadRequestException(
        'All documents must belong to the same user',
      );
    }

    const user = documents[0].user;

    // Check if any documents are already approved
    const alreadyApproved = documents.some((doc) => doc.status === 'APPROVED');
    if (alreadyApproved) {
      throw new BadRequestException('Some documents are already approved');
    }

    try {
      // Use transaction for atomic operation
      const result = await this.prisma.$transaction(async (tx) => {
        // Update documents status
        await tx.verificationDocument.updateMany({
          where: { id: { in: documentIds } },
          data: {
            status: 'APPROVED',
            reviewedBy: adminId,
            reviewedAt: new Date(),
            adminComments,
          },
        });

        // Generate secure temporary password
        const temporaryPassword = this.generateSecureTemporaryPassword();
        const hashedPassword = await this.hashPassword(temporaryPassword);

        // Update user account
        await tx.user.update({
          where: { id: userId },
          data: {
            accountStatus: 'ACTIVE',
            password: hashedPassword,
            isAccountActive: true,
            isEmailVerified: true,
          },
        });

        return { temporaryPassword };
      });

      // Send approval email with login credentials (outside transaction)
      try {
        await this.emailService.sendAccountApprovalEmail(
          user.email,
          user.name || 'User',
          result.temporaryPassword,
        );
      } catch (emailError) {
        this.logger.error(
          `Failed to send approval email to ${user.email}:`,
          emailError,
        );
        // Don't fail the entire operation if email fails
      }

      // Log security event
      await this.logSecurityEvent(userId, 'DOCUMENT_APPROVED', {
        adminId,
        documentIds,
        documentCount: documentIds.length,
      });

      this.logger.log(
        `✅ Documents approved for user ${userId} by admin ${adminId}`,
      );

      return {
        message: 'Documents approved and user activated successfully',
        userId,
        email: user.email,
      };
    } catch (error) {
      this.logger.error('Failed to approve documents:', error);
      throw new BadRequestException(
        'Failed to approve documents. Please try again.',
      );
    }
  }

  /**
   * Reject user documents with proper validation
   */
  async rejectDocuments(
    documentIds: string[],
    adminId: string,
    reason: string,
    adminComments?: string,
  ) {
    if (!documentIds || documentIds.length === 0) {
      throw new BadRequestException('Document IDs are required');
    }

    if (!reason || reason.trim().length === 0) {
      throw new BadRequestException('Rejection reason is required');
    }

    const documents = await this.prisma.verificationDocument.findMany({
      where: { id: { in: documentIds } },
      include: { user: true },
    });

    if (documents.length === 0) {
      throw new BadRequestException('Documents not found');
    }

    const userId = documents[0].userId;
    const user = documents[0].user;

    // Validate all documents belong to the same user
    const allSameUser = documents.every((doc) => doc.userId === userId);
    if (!allSameUser) {
      throw new BadRequestException(
        'All documents must belong to the same user',
      );
    }

    try {
      // Update documents status
      await this.prisma.verificationDocument.updateMany({
        where: { id: { in: documentIds } },
        data: {
          status: 'REJECTED',
          reviewedBy: adminId,
          reviewedAt: new Date(),
          adminComments,
        },
      });

      // Send rejection email
      try {
        await this.emailService.sendAccountRejectionEmail(
          user.email,
          user.name || 'User',
          reason,
        );
      } catch (emailError) {
        this.logger.error(
          `Failed to send rejection email to ${user.email}:`,
          emailError,
        );
        // Don't fail the operation if email fails
      }

      // Log security event
      await this.logSecurityEvent(userId, 'DOCUMENT_REJECTED', {
        adminId,
        reason,
        documentIds,
        documentCount: documentIds.length,
      });

      this.logger.log(
        `❌ Documents rejected for user ${userId} by admin ${adminId}`,
      );

      return {
        message: 'Documents rejected successfully',
        userId,
        email: user.email,
      };
    } catch (error) {
      this.logger.error('Failed to reject documents:', error);
      throw new BadRequestException(
        'Failed to reject documents. Please try again.',
      );
    }
  }

  /**
   * Get user's document verification status
   */
  async getUserDocumentStatus(userId: string) {
    return this.prisma.verificationDocument.findMany({
      where: { userId },
      orderBy: { submittedAt: 'desc' },
    });
  }

  /**
   * Generate secure temporary password using crypto
   */
  private generateSecureTemporaryPassword(): string {
    const upperCase = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const lowerCase = 'abcdefghjkmnpqrstuvwxyz';
    const numbers = '23456789';
    const special = '!@#$%&*';

    const allChars = upperCase + lowerCase + numbers + special;

    let password = '';

    // Ensure at least one character from each category
    password += upperCase[crypto.randomInt(0, upperCase.length)];
    password += lowerCase[crypto.randomInt(0, lowerCase.length)];
    password += numbers[crypto.randomInt(0, numbers.length)];
    password += special[crypto.randomInt(0, special.length)];

    // Fill the rest randomly (total 14 characters for security)
    for (let i = 4; i < 14; i++) {
      password += allChars[crypto.randomInt(0, allChars.length)];
    }

    // Shuffle the password to randomize position of guaranteed characters
    return password
      .split('')
      .sort(() => crypto.randomInt(0, 2) - 0.5)
      .join('');
  }

  /**
   * Hash password with higher salt rounds for security
   */
  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12); // Increased from 10 to 12 for better security
  }

  /**
   * Log security event with error handling
   */
  private async logSecurityEvent(
    userId: string,
    eventType: string,
    metadata: any,
  ) {
    try {
      await this.prisma.securityEvent.create({
        data: {
          userId,
          eventType: eventType as any,
          ipAddress: metadata.ipAddress || 'system',
          userAgent: metadata.userAgent,
          metadata,
        },
      });
    } catch (error) {
      this.logger.error('Failed to log security event:', error);
      // Don't throw error to avoid breaking the main flow
    }
  }
}
