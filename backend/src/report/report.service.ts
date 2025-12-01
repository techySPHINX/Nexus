import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReportDto } from './dto/create-report.dto';
import {
  ReportedContentType,
  ReportStatus,
  UserActionType,
  ModerationActionType,
  Prisma,
} from '@prisma/client';
import { ResolveReportDto } from './dto/resolve-report.dto';
import { TakeUserActionDto } from './dto/take-user-action.dto';
import { DeleteContentDto } from './dto/delete-content.dto';
import { FilterReportsDto } from './dto/filter-reports.dto';
import {
  BatchResolveReportsDto,
  BatchDismissReportsDto,
} from './dto/batch-operations.dto';
import { RevokeUserActionDto } from './dto/revoke-user-action.dto';

@Injectable()
export class ReportService {
  constructor(private prisma: PrismaService) { }

  /**
   * Create a new report - FIX: Auto-extract postId from comment
   */
  async createReport(dto: CreateReportDto, reporterId: string) {
    const { type, reason, postId, commentId } = dto;

    if (!postId && !commentId) {
      throw new BadRequestException(
        'Either postId or commentId must be provided.',
      );
    }

    if (postId && commentId) {
      throw new BadRequestException(
        'Cannot report both a post and a comment simultaneously.',
      );
    }

    // Ensure the provided id matches the report type
    if (type === ReportedContentType.POST && !postId) {
      throw new BadRequestException('postId must be provided for POST reports.');
    }
    if (type === ReportedContentType.COMMENT && !commentId) {
      throw new BadRequestException(
        'commentId must be provided for COMMENT reports.',
      );
    }

    let subCommunityId: string | null = null;
    let extractedPostId = postId;

    if (type === ReportedContentType.POST) {
      const post = await this.prisma.post.findUnique({
        where: { id: postId },
      });
      if (!post) {
        throw new NotFoundException('Post not found');
      }
      if (post.isDeleted) {
        throw new BadRequestException('Cannot report deleted content');
      }
      subCommunityId = post.subCommunityId ?? null;
    } else if (type === ReportedContentType.COMMENT) {
      const comment = await this.prisma.comment.findUnique({
        where: { id: commentId },
        include: { post: true },
      });
      if (!comment) {
        throw new NotFoundException('Comment not found');
      }
      if (comment.isDeleted) {
        throw new BadRequestException('Cannot report deleted content');
      }
      // FIX: Extract postId from comment
      extractedPostId = comment.postId;
      subCommunityId = comment.post?.subCommunityId ?? null;
    }

    // Check for duplicate reports
    const existingReport = await this.prisma.contentReport.findFirst({
      where: {
        reporterId,
        type,
        postId: extractedPostId,
        commentId,
        status: ReportStatus.PENDING,
      },
    });

    if (existingReport) {
      throw new BadRequestException(
        'You have already reported this content. Please wait for admin review.',
      );
    }

    try {
      const report = await this.prisma.contentReport.create({
        data: {
          reporterId,
          reason,
          type,
          postId: extractedPostId, // Always include postId
          commentId,
          subCommunityId,
        },
      });

      // Log the moderation action
      await this.createModerationLog({
        actionType: ModerationActionType.REPORT_CREATED,
        performedById: reporterId,
        reportId: report.id,
        postId: extractedPostId,
        commentId,
        details: `Report created for ${type.toLowerCase()}: ${reason}`,
      });

      return report;
    } catch {
      throw new InternalServerErrorException(
        'Failed to create report. Please try again.',
      );
    }
  }

  /**
   * Get all reports with advanced filtering and pagination
   */
  async getAllReports(
    userId: string,
    pageSize = 20,
    cursor: string | null,
    filters?: FilterReportsDto,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });

    if (!user || user.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can access reports.');
    }

    const limit = Math.max(1, Math.min(pageSize || 20, 100)); // Max 100
    const take = limit + 1;

    // Build where clause from filters
    const where: Prisma.ContentReportWhereInput = {};

    if (filters) {
      if (filters.type) where.type = filters.type;
      if (filters.status) where.status = filters.status;
      if (filters.reporterId) where.reporterId = filters.reporterId;
      if (filters.subCommunityId) where.subCommunityId = filters.subCommunityId;
      if (filters.handlerId) where.handlerId = filters.handlerId;

      if (filters.startDate || filters.endDate) {
        where.createdAt = {};
        if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
        if (filters.endDate) where.createdAt.lte = new Date(filters.endDate);
      }

      if (filters.searchTerm) {
        where.reason = { contains: filters.searchTerm, mode: 'insensitive' };
      }
    }

    const reports = await this.prisma.contentReport.findMany({
      take,
      cursor: cursor ? { id: cursor } : undefined,
      skip: cursor ? 1 : 0,
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        reporter: {
          select: { id: true, email: true, name: true, role: true },
        },
        handler: {
          select: { id: true, email: true, name: true },
        },
        post: {
          select: {
            id: true,
            subject: true,
            subCommunityId: true,
            isDeleted: true,
            authorId: true,
          },
        },
        comment: {
          select: {
            id: true,
            content: true,
            postId: true,
            isDeleted: true,
            userId: true,
          },
        },
        subCommunity: {
          select: { id: true, name: true },
        },
      },
    });

    let nextCursor: string | null = null;
    if (reports.length > limit) {
      const next = reports.pop();
      nextCursor = next?.id ?? null;
    }

    return { items: reports, nextCursor, total: reports.length };
  }

  /**
   * Get a single report by ID
   */
  async getReportById(reportId: string, adminId: string) {
    await this.validateAdmin(adminId);

    const report = await this.prisma.contentReport.findUnique({
      where: { id: reportId },
      include: {
        reporter: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            accountStatus: true,
          },
        },
        handler: {
          select: { id: true, email: true, name: true },
        },
        post: {
          select: {
            id: true,
            subject: true,
            content: true,
            authorId: true,
            isDeleted: true,
            deletedAt: true,
            deletedBy: true,
            deletionReason: true,
            createdAt: true,
            subCommunityId: true,
          },
        },
        comment: {
          select: {
            id: true,
            content: true,
            userId: true,
            postId: true,
            isDeleted: true,
            deletedAt: true,
            deletedBy: true,
            deletionReason: true,
            createdAt: true,
          },
        },
        subCommunity: {
          select: { id: true, name: true, description: true },
        },
        userActions: {
          where: { isActive: true },
          include: {
            admin: {
              select: { id: true, name: true, email: true },
            },
          },
        },
        moderationLogs: {
          orderBy: { createdAt: 'desc' },
          include: {
            performedBy: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    // Get violation history for the content author
    const targetUserId = report.post?.authorId || report.comment?.userId;
    let violationHistory: any[] = [];

    if (targetUserId) {
      violationHistory = await this.prisma.userAction.findMany({
        where: { userId: targetUserId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          admin: { select: { name: true } },
          report: { select: { id: true, type: true, reason: true } },
        },
      });
    }

    return { ...report, violationHistory };
  }

  /**
   * Resolve a report (mark as ADDRESSED)
   */
  async resolveReport(
    reportId: string,
    adminId: string,
    dto: ResolveReportDto,
  ) {
    await this.validateAdmin(adminId);

    const report = await this.prisma.contentReport.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    if (report.status !== ReportStatus.PENDING) {
      throw new BadRequestException(
        `Report has already been ${report.status.toLowerCase()}`,
      );
    }

    if (
      dto.action !== ReportStatus.ADDRESSED &&
      dto.action !== ReportStatus.DISMISSED
    ) {
      throw new BadRequestException(
        'Action must be either ADDRESSED or DISMISSED',
      );
    }

    const updatedReport = await this.prisma.contentReport.update({
      where: { id: reportId },
      data: {
        status: dto.action,
        handlerId: adminId,
      },
      include: {
        reporter: { select: { id: true, email: true, name: true } },
        post: { select: { id: true, subject: true } },
        comment: { select: { id: true, content: true } },
      },
    });

    // Log the action
    await this.createModerationLog({
      actionType:
        dto.action === ReportStatus.ADDRESSED
          ? ModerationActionType.REPORT_RESOLVED
          : ModerationActionType.REPORT_DISMISSED,
      performedById: adminId,
      reportId: report.id,
      postId: report.postId,
      commentId: report.commentId,
      details: `${dto.action}: ${dto.reason}. ${dto.notes || ''}`,
    });

    return updatedReport;
  }

  /**
   * Take action against a user
   */
  async takeUserAction(
    reportId: string,
    adminId: string,
    dto: TakeUserActionDto,
  ) {
    await this.validateAdmin(adminId);

    const report = await this.prisma.contentReport.findUnique({
      where: { id: reportId },
      include: {
        post: { select: { authorId: true } },
        comment: { select: { userId: true } },
      },
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    const targetUserId = report.post?.authorId || report.comment?.userId;
    if (!targetUserId) {
      throw new BadRequestException('Cannot determine target user');
    }

    // Validate duration for temporary ban
    if (dto.actionType === UserActionType.TEMPORARY_BAN) {
      if (!dto.durationDays && !dto.expiresAt) {
        throw new BadRequestException(
          'Either durationDays or expiresAt must be provided for temporary bans',
        );
      }
    }

    let expiresAt: Date | null = null;
    if (dto.actionType === UserActionType.TEMPORARY_BAN) {
      if (dto.expiresAt) {
        expiresAt = new Date(dto.expiresAt);
      } else if (dto.durationDays) {
        expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + dto.durationDays);
      }
    }

    const metadata = {
      notes: dto.notes,
      durationDays: dto.durationDays,
      reportType: report.type,
      reportReason: report.reason,
    };

    try {
      const userAction = await this.prisma.userAction.create({
        data: {
          userId: targetUserId,
          actionType: dto.actionType,
          reason: dto.reason,
          reportId,
          adminId,
          expiresAt,
          metadata,
        },
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      });

      // Update account status for bans
      if (
        dto.actionType === UserActionType.TEMPORARY_BAN ||
        dto.actionType === UserActionType.PERMANENT_BAN
      ) {
        await this.prisma.user.update({
          where: { id: targetUserId },
          data: {
            accountStatus:
              dto.actionType === UserActionType.PERMANENT_BAN
                ? 'SUSPENDED'
                : 'SUSPENDED',
            lockedUntil: expiresAt,
          },
        });
      }

      // Log the action
      await this.createModerationLog({
        actionType: ModerationActionType.USER_ACTION_TAKEN,
        performedById: adminId,
        targetUserId,
        reportId,
        postId: report.postId,
        commentId: report.commentId,
        details: `${dto.actionType}: ${dto.reason}`,
        metadata,
      });

      return userAction;
    } catch {
      throw new InternalServerErrorException(
        'Failed to take user action. Please try again.',
      );
    }
  }

  /**
   * Revoke a user action
   */
  async revokeUserAction(
    actionId: string,
    adminId: string,
    dto: RevokeUserActionDto,
  ) {
    await this.validateAdmin(adminId);

    const action = await this.prisma.userAction.findUnique({
      where: { id: actionId },
      include: { user: true },
    });

    if (!action) {
      throw new NotFoundException('User action not found');
    }

    if (!action.isActive) {
      throw new BadRequestException('This action has already been revoked');
    }

    const revokedAction = await this.prisma.userAction.update({
      where: { id: actionId },
      data: {
        isActive: false,
        revokedAt: new Date(),
        revokedBy: adminId,
        revokeReason: dto.reason,
      },
    });

    // Restore account status if it was a ban
    if (
      action.actionType === UserActionType.TEMPORARY_BAN ||
      action.actionType === UserActionType.PERMANENT_BAN
    ) {
      // Check if there are any other active bans
      const otherActiveBans = await this.prisma.userAction.findFirst({
        where: {
          userId: action.userId,
          isActive: true,
          id: { not: actionId },
          actionType: {
            in: [UserActionType.TEMPORARY_BAN, UserActionType.PERMANENT_BAN],
          },
        },
      });

      if (!otherActiveBans) {
        await this.prisma.user.update({
          where: { id: action.userId },
          data: {
            accountStatus: 'ACTIVE',
            lockedUntil: null,
          },
        });
      }
    }

    await this.createModerationLog({
      actionType: ModerationActionType.USER_ACTION_REVERTED,
      performedById: adminId,
      targetUserId: action.userId,
      reportId: action.reportId,
      details: `Revoked ${action.actionType}: ${dto.reason}`,
      metadata: { originalActionId: actionId },
    });

    return revokedAction;
  }

  /**
   * Delete post or comment (soft delete)
   */
  async deleteContent(
    reportId: string,
    adminId: string,
    dto: DeleteContentDto,
  ) {
    await this.validateAdmin(adminId);

    const report = await this.prisma.contentReport.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    let deleted: any;

    if (report.postId && report.type === ReportedContentType.POST) {
      deleted = await this.prisma.post.update({
        where: { id: report.postId },
        data: {
          isDeleted: true,
          deletedAt: new Date(),
          deletedBy: adminId,
          deletionReason: dto.reason,
        },
      });

      await this.createModerationLog({
        actionType: ModerationActionType.CONTENT_DELETED,
        performedById: adminId,
        reportId,
        postId: report.postId,
        targetUserId: deleted.authorId,
        details: `Post deleted: ${dto.reason}`,
      });
    } else if (report.commentId && report.type === ReportedContentType.COMMENT) {
      deleted = await this.prisma.comment.update({
        where: { id: report.commentId },
        data: {
          isDeleted: true,
          deletedAt: new Date(),
          deletedBy: adminId,
          deletionReason: dto.reason,
        },
      });

      await this.createModerationLog({
        actionType: ModerationActionType.CONTENT_DELETED,
        performedById: adminId,
        reportId,
        commentId: report.commentId,
        postId: report.postId,
        targetUserId: deleted.userId,
        details: `Comment deleted: ${dto.reason}`,
      });
    } else {
      throw new BadRequestException('No valid content to delete');
    }

    // Auto-resolve the report
    await this.prisma.contentReport.update({
      where: { id: reportId },
      data: { status: ReportStatus.ADDRESSED, handlerId: adminId },
    });

    return { success: true, deleted };
  }

  /**
   * Batch resolve reports
   */
  async batchResolveReports(adminId: string, dto: BatchResolveReportsDto) {
    await this.validateAdmin(adminId);

    const reports = await this.prisma.contentReport.findMany({
      where: {
        id: { in: dto.reportIds },
        status: ReportStatus.PENDING,
      },
    });

    if (reports.length === 0) {
      throw new BadRequestException('No pending reports found to resolve');
    }

    const updated = await this.prisma.contentReport.updateMany({
      where: { id: { in: reports.map((r) => r.id) } },
      data: {
        status: ReportStatus.ADDRESSED,
        handlerId: adminId,
      },
    });

    await this.createModerationLog({
      actionType: ModerationActionType.BATCH_OPERATION,
      performedById: adminId,
      details: `Batch resolved ${updated.count} reports: ${dto.reason}`,
      metadata: { reportIds: dto.reportIds, operation: 'BATCH_RESOLVE' },
    });

    return { success: true, count: updated.count };
  }

  /**
   * Batch dismiss reports
   */
  async batchDismissReports(adminId: string, dto: BatchDismissReportsDto) {
    await this.validateAdmin(adminId);

    const reports = await this.prisma.contentReport.findMany({
      where: {
        id: { in: dto.reportIds },
        status: ReportStatus.PENDING,
      },
    });

    if (reports.length === 0) {
      throw new BadRequestException('No pending reports found to dismiss');
    }

    const updated = await this.prisma.contentReport.updateMany({
      where: { id: { in: reports.map((r) => r.id) } },
      data: {
        status: ReportStatus.DISMISSED,
        handlerId: adminId,
      },
    });

    await this.createModerationLog({
      actionType: ModerationActionType.BATCH_OPERATION,
      performedById: adminId,
      details: `Batch dismissed ${updated.count} reports: ${dto.reason}`,
      metadata: { reportIds: dto.reportIds, operation: 'BATCH_DISMISS' },
    });

    return { success: true, count: updated.count };
  }

  /**
   * Get moderation analytics
   */
  async getAnalytics(adminId: string, days: number = 30) {
    await this.validateAdmin(adminId);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [
      totalReports,
      pendingReports,
      resolvedReports,
      dismissedReports,
      reportsByType,
      topReporters,
      topOffenders,
      recentActions,
    ] = await Promise.all([
      this.prisma.contentReport.count({
        where: { createdAt: { gte: startDate } },
      }),
      this.prisma.contentReport.count({
        where: { status: ReportStatus.PENDING },
      }),
      this.prisma.contentReport.count({
        where: {
          status: ReportStatus.ADDRESSED,
          createdAt: { gte: startDate },
        },
      }),
      this.prisma.contentReport.count({
        where: {
          status: ReportStatus.DISMISSED,
          createdAt: { gte: startDate },
        },
      }),
      this.prisma.contentReport.groupBy({
        by: ['type'],
        where: { createdAt: { gte: startDate } },
        _count: true,
      }),
      this.prisma.contentReport.groupBy({
        by: ['reporterId'],
        where: { createdAt: { gte: startDate } },
        _count: true,
        orderBy: { _count: { reporterId: 'desc' } },
        take: 5,
      }),
      this.prisma.userAction.groupBy({
        by: ['userId'],
        where: { createdAt: { gte: startDate } },
        _count: true,
        orderBy: { _count: { userId: 'desc' } },
        take: 5,
      }),
      this.prisma.moderationLog.findMany({
        where: { createdAt: { gte: startDate } },
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: {
          performedBy: { select: { name: true } },
        },
      }),
    ]);

    return {
      period: { days, startDate, endDate: new Date() },
      summary: {
        totalReports,
        pendingReports,
        resolvedReports,
        dismissedReports,
        resolutionRate:
          totalReports > 0
            ? ((resolvedReports + dismissedReports) / totalReports) * 100
            : 0,
      },
      reportsByType,
      topReporters,
      topOffenders,
      recentActions,
    };
  }

  /**
   * Get user violation history
   */
  async getUserViolations(userId: string, adminId: string) {
    await this.validateAdmin(adminId);

    const [userActions, reports] = await Promise.all([
      this.prisma.userAction.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        include: {
          admin: { select: { name: true, email: true } },
          report: { select: { type: true, reason: true } },
          revoker: { select: { name: true } },
        },
      }),
      this.prisma.contentReport.findMany({
        where: {
          OR: [
            { post: { authorId: userId } },
            { comment: { userId } },
          ],
        },
        orderBy: { createdAt: 'desc' },
        include: {
          reporter: { select: { name: true } },
          handler: { select: { name: true } },
        },
      }),
    ]);

    const activeActions = userActions.filter((a) => a.isActive);
    const activeBans = activeActions.filter(
      (a) =>
        a.actionType === UserActionType.TEMPORARY_BAN ||
        a.actionType === UserActionType.PERMANENT_BAN,
    );

    return {
      userId,
      totalViolations: userActions.length,
      activeActions: activeActions.length,
      activeBans: activeBans.length,
      totalReports: reports.length,
      actions: userActions,
      reports,
    };
  }

  /**
   * Helper: Create moderation log
   */
  private async createModerationLog(data: {
    actionType: ModerationActionType;
    performedById: string;
    targetUserId?: string;
    reportId?: string;
    postId?: string;
    commentId?: string;
    details: string;
    metadata?: any;
  }) {
    try {
      await this.prisma.moderationLog.create({ data });
    } catch (error) {
      // Log to console but don't fail the operation
      console.error('Failed to create moderation log:', error);
    }
  }

  /**
   * Helper: Validate admin
   */
  private async validateAdmin(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user || user.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can perform this action');
    }
  }
}
