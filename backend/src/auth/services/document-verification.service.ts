import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '../../email/email.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class DocumentVerificationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  /**
   * Submit documents for verification
   */
  async submitDocuments(
    userId: string,
    documents: Array<{ documentType: string; documentUrl: string }>,
  ) {
    const documentRecords = documents.map((doc) => ({
      userId,
      documentType: doc.documentType as any,
      documentUrl: doc.documentUrl,
    }));

    await this.prisma.verificationDocument.createMany({
      data: documentRecords,
    });

    // Update user account status
    await this.prisma.user.update({
      where: { id: userId },
      data: { accountStatus: 'PENDING_DOCUMENT_REVIEW' as any },
    });

    return { message: 'Documents submitted successfully for review' };
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
   * Approve user documents
   */
  async approveDocuments(
    documentIds: string[],
    adminId: string,
    adminComments?: string,
  ) {
    const documents = await this.prisma.verificationDocument.findMany({
      where: { id: { in: documentIds } },
      include: { user: true },
    });

    if (documents.length === 0) {
      throw new Error('Documents not found');
    }

    const userId = documents[0].userId;
    const user = documents[0].user;

    // Update documents status
    await this.prisma.verificationDocument.updateMany({
      where: { id: { in: documentIds } },
      data: {
        status: 'APPROVED',
        reviewedBy: adminId,
        reviewedAt: new Date(),
        adminComments,
      },
    });

    // Generate temporary password
    const temporaryPassword = this.generateTemporaryPassword();
    const hashedPassword = await this.hashPassword(temporaryPassword);

    // Update user account
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        accountStatus: 'ACTIVE',
        password: hashedPassword,
        isAccountActive: true,
      },
    });

    // Send approval email with login credentials
    await this.emailService.sendAccountApprovalEmail(
      user.email,
      user.name || 'User',
      temporaryPassword,
    );

    // Log security event
    await this.logSecurityEvent(userId, 'DOCUMENT_APPROVED', {
      adminId,
      documentIds,
    });

    return { message: 'Documents approved and user activated successfully' };
  }

  /**
   * Reject user documents
   */
  async rejectDocuments(
    documentIds: string[],
    adminId: string,
    reason: string,
    adminComments?: string,
  ) {
    const documents = await this.prisma.verificationDocument.findMany({
      where: { id: { in: documentIds } },
      include: { user: true },
    });

    if (documents.length === 0) {
      throw new Error('Documents not found');
    }

    const userId = documents[0].userId;
    const user = documents[0].user;

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
    await this.emailService.sendAccountRejectionEmail(
      user.email,
      user.name || 'User',
      reason,
    );

    // Log security event
    await this.logSecurityEvent(userId, 'DOCUMENT_REJECTED', {
      adminId,
      reason,
      documentIds,
    });

    return { message: 'Documents rejected successfully' };
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
   * Generate temporary password
   */
  private generateTemporaryPassword(): string {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  /**
   * Hash password
   */
  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
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
}
