import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '../../email/email.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import {
  GetPendingDocumentsFilterDto,
  PendingDocumentsResponseDto,
  PendingDocumentsStatsDto,
  SortBy,
} from '../../admin/dto';

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
   * Get pending documents for admin review with advanced filtering
   */
  async getPendingDocuments(
    filters?: GetPendingDocumentsFilterDto,
  ): Promise<PendingDocumentsResponseDto> {
    const {
      page = 1,
      limit = 20,
      sortBy = SortBy.SUBMITTED_AT,
      sortOrder = 'asc',
      graduationYear,
      graduationYearFrom,
      graduationYearTo,
      role,
      searchName,
      searchEmail,
      department,
      branch,
      course,
      year,
      location,
      documentType,
      documentTypes,
      submittedAfter,
      submittedBefore,
      accountStatus,
      includeStats = false,
    } = filters || {};

    // Build where clause with advanced filters
    const where: any = {
      status: 'PENDING',
      user: {},
    };

    // User table filters
    if (role) {
      where.user.role = role.toUpperCase();
    }

    if (graduationYear) {
      where.user.graduationYear = graduationYear;
    }

    if (graduationYearFrom || graduationYearTo) {
      where.user.graduationYear = {};
      if (graduationYearFrom) {
        where.user.graduationYear.gte = graduationYearFrom;
      }
      if (graduationYearTo) {
        where.user.graduationYear.lte = graduationYearTo;
      }
    }

    if (searchName) {
      where.user.name = {
        contains: searchName,
        mode: 'insensitive',
      };
    }

    if (searchEmail) {
      where.user.email = {
        contains: searchEmail,
        mode: 'insensitive',
      };
    }

    if (accountStatus) {
      where.user.accountStatus = accountStatus;
    }

    // Profile filters (nested)
    const profileFilters: any = {};
    if (department) {
      profileFilters.dept = {
        contains: department,
        mode: 'insensitive',
      };
    }

    if (branch) {
      profileFilters.branch = {
        contains: branch,
        mode: 'insensitive',
      };
    }

    if (course) {
      profileFilters.course = {
        contains: course,
        mode: 'insensitive',
      };
    }

    if (year) {
      profileFilters.year = year;
    }

    if (location) {
      profileFilters.location = {
        contains: location,
        mode: 'insensitive',
      };
    }

    if (Object.keys(profileFilters).length > 0) {
      where.user.profile = profileFilters;
    }

    // Document filters
    if (documentType && documentType !== 'ALL') {
      where.documentType = documentType;
    }

    if (documentTypes && documentTypes.length > 0) {
      where.documentType = {
        in: documentTypes,
      };
    }

    // Date range filters
    if (submittedAfter || submittedBefore) {
      where.submittedAt = {};
      if (submittedAfter) {
        where.submittedAt.gte = new Date(submittedAfter);
      }
      if (submittedBefore) {
        where.submittedAt.lte = new Date(submittedBefore);
      }
    }

    // Clean up empty objects
    if (Object.keys(where.user).length === 0) {
      delete where.user;
    }

    // Build orderBy clause
    const orderBy: any = {};
    switch (sortBy) {
      case SortBy.SUBMITTED_AT:
        orderBy.submittedAt = sortOrder;
        break;
      case SortBy.USER_NAME:
        orderBy.user = { name: sortOrder };
        break;
      case SortBy.GRADUATION_YEAR:
        orderBy.user = { graduationYear: sortOrder };
        break;
      case SortBy.ROLE:
        orderBy.user = { role: sortOrder };
        break;
      case SortBy.DEPARTMENT:
        orderBy.submittedAt = sortOrder; // fallback
        break;
      default:
        orderBy.submittedAt = sortOrder;
    }

    try {
      // Get total count
      const total = await this.prisma.verificationDocument.count({ where });

      // Calculate pagination
      const skip = (page - 1) * limit;
      const totalPages = Math.ceil(total / limit);

      // Fetch documents with relations
      const documents = await this.prisma.verificationDocument.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              role: true,
              graduationYear: true,
              createdAt: true,
              accountStatus: true,
              iconUrl: true,
              description: true,
              profile: {
                select: {
                  dept: true,
                  branch: true,
                  course: true,
                  year: true,
                  location: true,
                  studentId: true,
                  bio: true,
                },
              },
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      });

      // Build response
      const response: PendingDocumentsResponseDto = {
        data: documents,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      };

      // Include statistics if requested
      if (includeStats) {
        response.stats = await this.calculatePendingDocumentsStats();
      }

      this.logger.log(
        `📊 Fetched ${documents.length} pending documents (Page ${page}/${totalPages})`,
      );

      return response;
    } catch (error) {
      this.logger.error('Failed to fetch pending documents:', error);
      throw new BadRequestException('Failed to fetch pending documents');
    }
  }

  /**
   * Calculate comprehensive statistics for pending documents
   */
  private async calculatePendingDocumentsStats(): Promise<PendingDocumentsStatsDto> {
    try {
      const allPending = await this.prisma.verificationDocument.findMany({
        where: { status: 'PENDING' },
        include: {
          user: {
            select: {
              role: true,
              graduationYear: true,
              profile: {
                select: {
                  dept: true,
                },
              },
            },
          },
        },
      });

      const total = allPending.length;

      // By Role
      const byRole = {
        STUDENT: allPending.filter((d) => d.user.role === 'STUDENT').length,
        ALUMNI: allPending.filter((d) => d.user.role === 'ALUM').length,
      };

      // By Department
      const byDepartment: Record<string, number> = {};
      allPending.forEach((doc) => {
        const dept = doc.user.profile?.dept || 'Not Specified';
        byDepartment[dept] = (byDepartment[dept] || 0) + 1;
      });

      // By Graduation Year
      const byGraduationYear: Record<string, number> = {};
      allPending.forEach((doc) => {
        const year = doc.user.graduationYear?.toString() || 'Not Specified';
        byGraduationYear[year] = (byGraduationYear[year] || 0) + 1;
      });

      // By Document Type
      const byDocumentType: Record<string, number> = {};
      allPending.forEach((doc) => {
        const type = doc.documentType || 'OTHERS';
        byDocumentType[type] = (byDocumentType[type] || 0) + 1;
      });

      // Calculate average waiting time
      const now = new Date();
      const waitingTimes = allPending.map(
        (doc) =>
          (now.getTime() - new Date(doc.submittedAt).getTime()) /
          (1000 * 60 * 60),
      );
      const avgWaitingTime =
        waitingTimes.length > 0
          ? waitingTimes.reduce((a, b) => a + b, 0) / waitingTimes.length
          : 0;

      // Get oldest and newest request dates
      const submittedDates = allPending.map((d) => new Date(d.submittedAt));
      const oldestRequest =
        submittedDates.length > 0
          ? new Date(Math.min(...submittedDates.map((d) => d.getTime())))
          : null;
      const newestRequest =
        submittedDates.length > 0
          ? new Date(Math.max(...submittedDates.map((d) => d.getTime())))
          : null;

      return {
        total,
        byRole,
        byDepartment,
        byGraduationYear,
        byDocumentType,
        avgWaitingTime: Math.round(avgWaitingTime * 100) / 100,
        oldestRequest,
        newestRequest,
      };
    } catch (error) {
      this.logger.error('Failed to calculate statistics:', error);
      // Return empty stats on error
      return {
        total: 0,
        byRole: { STUDENT: 0, ALUMNI: 0 },
        byDepartment: {},
        byGraduationYear: {},
        byDocumentType: {},
        avgWaitingTime: 0,
        oldestRequest: null,
        newestRequest: null,
      };
    }
  }

  /**
   * Approve user documents with transaction support
   * Supports batch approval of multiple users
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

    // Group documents by user for batch processing
    const documentsByUser = new Map<string, typeof documents>();
    documents.forEach((doc) => {
      if (!documentsByUser.has(doc.userId)) {
        documentsByUser.set(doc.userId, []);
      }
      documentsByUser.get(doc.userId)!.push(doc);
    });

    const results = {
      successful: [] as Array<{ userId: string; email: string; userName: string }>,
      failed: [] as Array<{ userId: string; email: string; reason: string }>,
      alreadyApproved: [] as Array<{ userId: string; email: string }>,
    };

    // Process each user's documents
    for (const [userId, userDocs] of documentsByUser) {
      try {
        const user = userDocs[0].user;

        // Check if any documents are already approved
        const alreadyApproved = userDocs.some((doc) => doc.status === 'APPROVED');
        if (alreadyApproved) {
          results.alreadyApproved.push({
            userId,
            email: user.email,
          });
          this.logger.warn(`⚠️ Some documents already approved for user ${userId}`);
          continue;
        }

        // Check if user account is already active
        if (user.isAccountActive && user.accountStatus === 'ACTIVE') {
          results.alreadyApproved.push({
            userId,
            email: user.email,
          });
          this.logger.warn(`⚠️ User ${userId} already activated`);
          continue;
        }

        const userDocIds = userDocs.map(d => d.id);

        // Use transaction for atomic operation per user
        const result = await this.prisma.$transaction(async (tx) => {
          // Update documents status
          await tx.verificationDocument.updateMany({
            where: { id: { in: userDocIds } },
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
          documentIds: userDocIds,
          documentCount: userDocIds.length,
        });

        results.successful.push({
          userId,
          email: user.email,
          userName: user.name || 'User',
        });

        this.logger.log(
          `✅ Documents approved for user ${userId} (${user.email}) by admin ${adminId}`,
        );
      } catch (error) {
        this.logger.error(`Failed to approve documents for user ${userId}:`, error);
        results.failed.push({
          userId,
          email: userDocs[0].user.email,
          reason: error.message || 'Unknown error',
        });
      }
    }

    // Return comprehensive batch results
    return {
      message: `Batch approval completed: ${results.successful.length} successful, ${results.failed.length} failed, ${results.alreadyApproved.length} already approved`,
      totalProcessed: documentsByUser.size,
      successful: results.successful,
      failed: results.failed,
      alreadyApproved: results.alreadyApproved,
      stats: {
        successCount: results.successful.length,
        failedCount: results.failed.length,
        alreadyApprovedCount: results.alreadyApproved.length,
      },
    };
  }

  /**
   * Reject user documents with proper validation
   * Supports batch rejection of multiple users
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

    // Group documents by user for batch processing
    const documentsByUser = new Map<string, typeof documents>();
    documents.forEach((doc) => {
      if (!documentsByUser.has(doc.userId)) {
        documentsByUser.set(doc.userId, []);
      }
      documentsByUser.get(doc.userId)!.push(doc);
    });

    const results = {
      successful: [] as Array<{ userId: string; email: string; userName: string }>,
      failed: [] as Array<{ userId: string; email: string; reason: string }>,
    };

    // Process each user's documents
    for (const [userId, userDocs] of documentsByUser) {
      try {
        const user = userDocs[0].user;
        const userDocIds = userDocs.map(d => d.id);

        // Update documents status
        await this.prisma.verificationDocument.updateMany({
          where: { id: { in: userDocIds } },
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
          documentIds: userDocIds,
          documentCount: userDocIds.length,
        });

        results.successful.push({
          userId,
          email: user.email,
          userName: user.name || 'User',
        });

        this.logger.log(
          `❌ Documents rejected for user ${userId} (${user.email}) by admin ${adminId}`,
        );
      } catch (error) {
        this.logger.error(`Failed to reject documents for user ${userId}:`, error);
        results.failed.push({
          userId,
          email: userDocs[0].user.email,
          reason: error.message || 'Unknown error',
        });
      }
    }

    // Return comprehensive batch results
    return {
      message: `Batch rejection completed: ${results.successful.length} successful, ${results.failed.length} failed`,
      totalProcessed: documentsByUser.size,
      successful: results.successful,
      failed: results.failed,
      stats: {
        successCount: results.successful.length,
        failedCount: results.failed.length,
      },
    };
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
