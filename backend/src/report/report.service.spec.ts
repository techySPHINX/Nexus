/**
 * Production-Grade Report System Test Suite
 * 
 * Tests all critical functionality:
 * - Report creation with auto postId extraction
 * - Report resolution and dismissal
 * - User actions (warnings, bans)
 * - Content soft deletion
 * - Batch operations
 * - Analytics
 * - Audit logging
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ReportService } from './report.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  ReportedContentType,
  ReportStatus,
  UserActionType,
  ModerationActionType,
} from '@prisma/client';
import {
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';

describe('ReportService - Production Grade', () => {
  let service: ReportService;
  let prisma: PrismaService;

  const mockAdminUser = {
    id: 'admin-id',
    role: 'ADMIN',
  };

  const mockRegularUser = {
    id: 'user-id',
    role: 'STUDENT',
  };

  const mockPost = {
    id: 'post-id',
    authorId: 'author-id',
    subject: 'Test Post',
    content: 'Test content',
    isDeleted: false,
    subCommunityId: 'sub-id',
  };

  const mockComment = {
    id: 'comment-id',
    userId: 'commenter-id',
    postId: 'post-id',
    content: 'Test comment',
    isDeleted: false,
    post: mockPost,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              update: jest.fn(),
            },
            post: {
              findUnique: jest.fn(),
              update: jest.fn(),
            },
            comment: {
              findUnique: jest.fn(),
              update: jest.fn(),
            },
            contentReport: {
              create: jest.fn(),
              findFirst: jest.fn(),
              findUnique: jest.fn(),
              findMany: jest.fn(),
              update: jest.fn(),
              updateMany: jest.fn(),
              count: jest.fn(),
              groupBy: jest.fn(),
            },
            userAction: {
              create: jest.fn(),
              findUnique: jest.fn(),
              findFirst: jest.fn(),
              findMany: jest.fn(),
              update: jest.fn(),
              groupBy: jest.fn(),
            },
            moderationLog: {
              create: jest.fn(),
              findMany: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<ReportService>(ReportService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('createReport - PostId Auto-Extraction Fix', () => {
    it('should auto-extract postId from comment when reporting comment', async () => {
      jest.spyOn(prisma.comment, 'findUnique').mockResolvedValue(mockComment as any);
      jest.spyOn(prisma.contentReport, 'findFirst').mockResolvedValue(null);
      jest.spyOn(prisma.contentReport, 'create').mockResolvedValue({
        id: 'report-id',
        reporterId: 'reporter-id',
        reason: 'Test reason',
        type: ReportedContentType.COMMENT,
        postId: 'post-id',
        commentId: 'comment-id',
        subCommunityId: 'sub-id',
        status: ReportStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
        handlerId: null,
      } as any);
      jest.spyOn(prisma.moderationLog, 'create').mockResolvedValue({} as any);

      const dto = {
        type: ReportedContentType.COMMENT,
        reason: 'Spam content',
        commentId: 'comment-id',
      };

      const result = await service.createReport(dto as any, 'reporter-id');

      expect(result.postId).toBe('post-id');
      expect(prisma.contentReport.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          postId: 'post-id',
          commentId: 'comment-id',
        }),
      });
    });

    it('should prevent reporting deleted content', async () => {
      jest.spyOn(prisma.comment, 'findUnique').mockResolvedValue({
        ...mockComment,
        isDeleted: true,
      } as any);

      const dto = {
        type: ReportedContentType.COMMENT,
        reason: 'Test',
        commentId: 'comment-id',
      };

      await expect(service.createReport(dto as any, 'reporter-id')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should prevent duplicate reports', async () => {
      jest.spyOn(prisma.comment, 'findUnique').mockResolvedValue(mockComment as any);
      jest.spyOn(prisma.contentReport, 'findFirst').mockResolvedValue({
        id: 'existing-report',
      } as any);

      const dto = {
        type: ReportedContentType.COMMENT,
        reason: 'Test',
        commentId: 'comment-id',
      };

      await expect(service.createReport(dto as any, 'reporter-id')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('User Actions', () => {
    it('should create temporary ban with expiration', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockAdminUser as any);
      jest.spyOn(prisma.contentReport, 'findUnique').mockResolvedValue({
        id: 'report-id',
        post: { authorId: 'violator-id' },
      } as any);
      jest.spyOn(prisma.userAction, 'create').mockResolvedValue({
        id: 'action-id',
        userId: 'violator-id',
        actionType: UserActionType.TEMPORARY_BAN,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      } as any);
      jest.spyOn(prisma.user, 'update').mockResolvedValue({} as any);
      jest.spyOn(prisma.moderationLog, 'create').mockResolvedValue({} as any);

      const dto = {
        actionType: UserActionType.TEMPORARY_BAN,
        reason: 'Repeated violations',
        durationDays: 7,
      };

      const result = await service.takeUserAction('report-id', 'admin-id', dto as any);

      expect(result.actionType).toBe(UserActionType.TEMPORARY_BAN);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'violator-id' },
        data: expect.objectContaining({
          accountStatus: 'SUSPENDED',
        }),
      });
    });

    it('should revoke user action and restore account', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockAdminUser as any);
      jest.spyOn(prisma.userAction, 'findUnique').mockResolvedValue({
        id: 'action-id',
        userId: 'user-id',
        actionType: UserActionType.TEMPORARY_BAN,
        isActive: true,
      } as any);
      jest.spyOn(prisma.userAction, 'update').mockResolvedValue({} as any);
      jest.spyOn(prisma.userAction, 'findFirst').mockResolvedValue(null);
      jest.spyOn(prisma.user, 'update').mockResolvedValue({} as any);
      jest.spyOn(prisma.moderationLog, 'create').mockResolvedValue({} as any);

      const dto = {
        reason: 'Appeal approved',
      };

      await service.revokeUserAction('action-id', 'admin-id', dto as any);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-id' },
        data: {
          accountStatus: 'ACTIVE',
          lockedUntil: null,
        },
      });
    });
  });

  describe('Content Soft Deletion', () => {
    it('should soft delete post with audit trail', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockAdminUser as any);
      jest.spyOn(prisma.contentReport, 'findUnique').mockResolvedValue({
        id: 'report-id',
        postId: 'post-id',
        type: ReportedContentType.POST,
      } as any);
      jest.spyOn(prisma.post, 'update').mockResolvedValue({
        ...mockPost,
        isDeleted: true,
      } as any);
      jest.spyOn(prisma.contentReport, 'update').mockResolvedValue({} as any);
      jest.spyOn(prisma.moderationLog, 'create').mockResolvedValue({} as any);

      const dto = {
        reason: 'Violates ToS',
      };

      const result = await service.deleteContent('report-id', 'admin-id', dto);

      expect(result.success).toBe(true);
      expect(prisma.post.update).toHaveBeenCalledWith({
        where: { id: 'post-id' },
        data: expect.objectContaining({
          isDeleted: true,
          deletedBy: 'admin-id',
          deletionReason: 'Violates ToS',
        }),
      });
    });
  });

  describe('Batch Operations', () => {
    it('should batch resolve multiple reports', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockAdminUser as any);
      jest.spyOn(prisma.contentReport, 'findMany').mockResolvedValue([
        { id: 'report-1' },
        { id: 'report-2' },
      ] as any);
      jest.spyOn(prisma.contentReport, 'updateMany').mockResolvedValue({ count: 2 });
      jest.spyOn(prisma.moderationLog, 'create').mockResolvedValue({} as any);

      const dto = {
        reportIds: ['report-1', 'report-2'],
        reason: 'Bulk cleanup',
      };

      const result = await service.batchResolveReports('admin-id', dto);

      expect(result.count).toBe(2);
      expect(prisma.moderationLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          actionType: ModerationActionType.BATCH_OPERATION,
        }),
      });
    });
  });

  describe('Security & Authorization', () => {
    it('should prevent non-admin from accessing reports', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockRegularUser as any);

      await expect(
        service.getAllReports('user-id', 20, null),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should prevent non-admin from taking user actions', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockRegularUser as any);

      const dto = {
        actionType: UserActionType.WARNING,
        reason: 'Test',
      };

      await expect(
        service.takeUserAction('report-id', 'user-id', dto),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('Analytics', () => {
    it('should generate comprehensive analytics', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockAdminUser as any);
      jest.spyOn(prisma.contentReport, 'count').mockResolvedValue(100);
      // Use Object.assign to bypass Prisma's complex groupBy types
      Object.assign(prisma.contentReport, {
        groupBy: jest.fn().mockResolvedValue([
          { type: ReportedContentType.POST, _count: 60 },
          { type: ReportedContentType.COMMENT, _count: 40 },
        ]),
      });
      Object.assign(prisma.userAction, {
        groupBy: jest.fn().mockResolvedValue([]),
      });
      jest.spyOn(prisma.moderationLog, 'findMany').mockResolvedValue([]);

      const result = await service.getAnalytics('admin-id', 30);

      expect(result.summary.totalReports).toBe(100);
      expect(result.reportsByType).toHaveLength(2);
    });
  });
});
