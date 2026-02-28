/**
 * Comprehensive Unit Test Suite for ReferralAnalyticsService
 *
 * Covers:
 * - Alumni analytics (referral performance, conversion rates, top referrals)
 * - Student analytics (application success rates, recent applications)
 * - Platform analytics (aggregated metrics, top companies)
 * - Application funnel (staged conversion data)
 * - Monthly trends (time-series aggregation)
 * - Edge cases (no data, user not found, date filtering)
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ReferralAnalyticsService } from './referral-analytics.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';
import { ApplicationStatus } from '@prisma/client';

describe('ReferralAnalyticsService', () => {
  let service: ReferralAnalyticsService;

  const mockUser = { id: 'user-1', role: 'ALUM' };
  const mockStudent = { id: 'student-1', role: 'STUDENT' };

  const createMockPrisma = () => ({
    user: {
      findUnique: jest.fn(),
    },
    referral: {
      count: jest.fn(),
      findMany: jest.fn(),
      groupBy: jest.fn(),
      aggregate: jest.fn(),
      update: jest.fn(),
    },
    referralApplication: {
      count: jest.fn(),
      findMany: jest.fn(),
      groupBy: jest.fn(),
    },
  });

  let mockPrisma: ReturnType<typeof createMockPrisma>;

  beforeEach(async () => {
    mockPrisma = createMockPrisma();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReferralAnalyticsService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<ReferralAnalyticsService>(ReferralAnalyticsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAlumniAnalytics', () => {
    it('should return alumni analytics with correct structure', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.referral.count.mockResolvedValue(10);
      mockPrisma.referralApplication.count.mockResolvedValue(25);
      mockPrisma.referralApplication.groupBy.mockResolvedValue([
        { status: ApplicationStatus.PENDING, _count: { _all: 10 } },
        { status: ApplicationStatus.REVIEWED, _count: { _all: 5 } },
        { status: ApplicationStatus.SHORTLISTED, _count: { _all: 5 } },
        { status: ApplicationStatus.ACCEPTED, _count: { _all: 3 } },
        { status: ApplicationStatus.REJECTED, _count: { _all: 2 } },
      ]);
      mockPrisma.referral.findMany.mockResolvedValue([
        {
          id: 'ref-1',
          jobTitle: 'SDE',
          company: 'Google',
          viewCount: 100,
          _count: { applications: 15 },
        },
      ]);
      mockPrisma.referral.groupBy.mockResolvedValue([
        { status: 'APPROVED', _count: { _all: 7 } },
        { status: 'PENDING', _count: { _all: 3 } },
      ]);

      const result = await service.getAlumniAnalytics('user-1', {});

      expect(result.overview.totalReferrals).toBe(10);
      expect(result.overview.totalApplications).toBe(25);
      expect(result.overview.conversionRate).toBe(12);
      expect(result.applicationsByStatus).toHaveProperty('PENDING', 10);
      expect(result.applicationsByStatus).toHaveProperty('ACCEPTED', 3);
      expect(result.referralsByStatus).toHaveProperty('APPROVED', 7);
      expect(result.topReferrals).toHaveLength(1);
      expect(result.topReferrals[0].jobTitle).toBe('SDE');
      expect(result.topReferrals[0].applicationCount).toBe(15);
    });

    it('should throw NotFoundException when user does not exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.getAlumniAnalytics('nonexistent', {}),
      ).rejects.toThrow(NotFoundException);
    });

    it('should return zero conversion rate when no applications exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.referral.count.mockResolvedValue(5);
      mockPrisma.referralApplication.count.mockResolvedValue(0);
      mockPrisma.referralApplication.groupBy.mockResolvedValue([]);
      mockPrisma.referral.findMany.mockResolvedValue([]);
      mockPrisma.referral.groupBy.mockResolvedValue([]);

      const result = await service.getAlumniAnalytics('user-1', {});

      expect(result.overview.conversionRate).toBe(0);
      expect(result.overview.totalApplications).toBe(0);
      expect(result.topReferrals).toHaveLength(0);
    });

    it('should apply date filters when provided', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.referral.count.mockResolvedValue(3);
      mockPrisma.referralApplication.count.mockResolvedValue(5);
      mockPrisma.referralApplication.groupBy.mockResolvedValue([]);
      mockPrisma.referral.findMany.mockResolvedValue([]);
      mockPrisma.referral.groupBy.mockResolvedValue([]);

      await service.getAlumniAnalytics('user-1', {
        dateFrom: '2025-01-01',
        dateTo: '2025-12-31',
      });

      // Verify date filters were passed to Prisma queries
      expect(mockPrisma.referral.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: {
              gte: new Date('2025-01-01'),
              lte: new Date('2025-12-31'),
            },
          }),
        }),
      );
    });

    it('should calculate conversion rate correctly', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.referral.count.mockResolvedValue(2);
      mockPrisma.referralApplication.count.mockResolvedValue(100);
      mockPrisma.referralApplication.groupBy.mockResolvedValue([
        { status: ApplicationStatus.ACCEPTED, _count: { _all: 33 } },
        { status: ApplicationStatus.REJECTED, _count: { _all: 67 } },
      ]);
      mockPrisma.referral.findMany.mockResolvedValue([]);
      mockPrisma.referral.groupBy.mockResolvedValue([]);

      const result = await service.getAlumniAnalytics('user-1', {});

      expect(result.overview.conversionRate).toBe(33);
    });
  });

  describe('getStudentAnalytics', () => {
    it('should return student analytics with correct structure', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockStudent);
      mockPrisma.referralApplication.count.mockResolvedValue(8);
      mockPrisma.referralApplication.groupBy.mockResolvedValue([
        { status: ApplicationStatus.PENDING, _count: { _all: 3 } },
        { status: ApplicationStatus.ACCEPTED, _count: { _all: 2 } },
        { status: ApplicationStatus.REJECTED, _count: { _all: 3 } },
      ]);
      mockPrisma.referralApplication.findMany.mockResolvedValue([
        {
          id: 'app-1',
          status: ApplicationStatus.PENDING,
          createdAt: new Date('2025-06-01'),
          referral: { jobTitle: 'SDE', company: 'Google' },
        },
      ]);

      const result = await service.getStudentAnalytics('student-1', {});

      expect(result.overview.totalApplications).toBe(8);
      expect(result.overview.successRate).toBe(25);
      expect(result.applicationsByStatus).toHaveProperty('PENDING', 3);
      expect(result.applicationsByStatus).toHaveProperty('ACCEPTED', 2);
      expect(result.recentApplications).toHaveLength(1);
      expect(result.recentApplications[0].company).toBe('Google');
    });

    it('should throw NotFoundException when student does not exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.getStudentAnalytics('nonexistent', {}),
      ).rejects.toThrow(NotFoundException);
    });

    it('should return zero success rate when no applications exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockStudent);
      mockPrisma.referralApplication.count.mockResolvedValue(0);
      mockPrisma.referralApplication.groupBy.mockResolvedValue([]);
      mockPrisma.referralApplication.findMany.mockResolvedValue([]);

      const result = await service.getStudentAnalytics('student-1', {});

      expect(result.overview.successRate).toBe(0);
      expect(result.overview.totalApplications).toBe(0);
      expect(result.recentApplications).toHaveLength(0);
    });

    it('should apply date filters for student analytics', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockStudent);
      mockPrisma.referralApplication.count.mockResolvedValue(2);
      mockPrisma.referralApplication.groupBy.mockResolvedValue([]);
      mockPrisma.referralApplication.findMany.mockResolvedValue([]);

      await service.getStudentAnalytics('student-1', {
        dateFrom: '2025-06-01',
      });

      expect(mockPrisma.referralApplication.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: expect.objectContaining({
              gte: new Date('2025-06-01'),
            }),
          }),
        }),
      );
    });
  });

  describe('getPlatformAnalytics', () => {
    it('should return platform-wide analytics', async () => {
      mockPrisma.referral.count.mockResolvedValue(50);
      mockPrisma.referralApplication.count.mockResolvedValue(200);
      mockPrisma.referral.groupBy.mockResolvedValue([
        { status: 'APPROVED', _count: { _all: 30 } },
        { status: 'PENDING', _count: { _all: 15 } },
        { status: 'REJECTED', _count: { _all: 5 } },
      ]);
      mockPrisma.referralApplication.groupBy.mockResolvedValue([
        { status: ApplicationStatus.PENDING, _count: { _all: 80 } },
        { status: ApplicationStatus.ACCEPTED, _count: { _all: 40 } },
        { status: ApplicationStatus.REJECTED, _count: { _all: 80 } },
      ]);
      // Mock topCompanies via referral.groupBy (called twice — once for referralsByStatus, once for topCompanies)
      mockPrisma.referral.groupBy
        .mockResolvedValueOnce([
          { status: 'APPROVED', _count: { _all: 30 } },
          { status: 'PENDING', _count: { _all: 15 } },
          { status: 'REJECTED', _count: { _all: 5 } },
        ])
        .mockResolvedValueOnce([
          { company: 'Google', _count: { company: 20 } },
          { company: 'Meta', _count: { company: 15 } },
        ]);
      mockPrisma.referral.aggregate.mockResolvedValue({
        _sum: { viewCount: 1500 },
      });

      const result = await service.getPlatformAnalytics({});

      expect(result.overview.totalReferrals).toBe(50);
      expect(result.overview.totalApplications).toBe(200);
      expect(result.overview.totalViews).toBe(1500);
      expect(result.overview.conversionRate).toBe(20);
      expect(result.topCompanies).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ company: 'Google', count: 20 }),
        ]),
      );
    });

    it('should handle empty platform data', async () => {
      mockPrisma.referral.count.mockResolvedValue(0);
      mockPrisma.referralApplication.count.mockResolvedValue(0);
      mockPrisma.referral.groupBy.mockResolvedValue([]);
      mockPrisma.referralApplication.groupBy.mockResolvedValue([]);
      mockPrisma.referral.aggregate.mockResolvedValue({
        _sum: { viewCount: null },
      });

      const result = await service.getPlatformAnalytics({});

      expect(result.overview.totalReferrals).toBe(0);
      expect(result.overview.totalApplications).toBe(0);
      expect(result.overview.totalViews).toBe(0);
      expect(result.overview.conversionRate).toBe(0);
      expect(result.topCompanies).toHaveLength(0);
    });
  });

  describe('getApplicationFunnel', () => {
    it('should return funnel data with all stages', async () => {
      mockPrisma.referral.aggregate.mockResolvedValue({
        _sum: { viewCount: 1000 },
      });
      mockPrisma.referralApplication.count.mockResolvedValue(300);
      mockPrisma.referralApplication.groupBy.mockResolvedValue([
        { status: ApplicationStatus.SHORTLISTED, _count: { _all: 100 } },
        { status: ApplicationStatus.OFFERED, _count: { _all: 50 } },
        { status: ApplicationStatus.ACCEPTED, _count: { _all: 30 } },
      ]);

      const result = await service.getApplicationFunnel({});

      expect(result.funnel).toHaveLength(5);
      expect(result.funnel[0]).toEqual({ stage: 'Viewed', count: 1000 });
      expect(result.funnel[1]).toEqual({ stage: 'Applied', count: 300 });
      expect(result.funnel[2]).toEqual({ stage: 'Shortlisted', count: 100 });
      expect(result.funnel[3]).toEqual({ stage: 'Offered', count: 50 });
      expect(result.funnel[4]).toEqual({ stage: 'Accepted', count: 30 });
    });

    it('should handle zero funnel data', async () => {
      mockPrisma.referral.aggregate.mockResolvedValue({
        _sum: { viewCount: 0 },
      });
      mockPrisma.referralApplication.count.mockResolvedValue(0);
      mockPrisma.referralApplication.groupBy.mockResolvedValue([]);

      const result = await service.getApplicationFunnel({});

      expect(result.funnel).toHaveLength(5);
      result.funnel.forEach((stage) => {
        expect(stage.count).toBe(0);
      });
    });

    it('should handle null viewCount sum', async () => {
      mockPrisma.referral.aggregate.mockResolvedValue({
        _sum: { viewCount: null },
      });
      mockPrisma.referralApplication.count.mockResolvedValue(10);
      mockPrisma.referralApplication.groupBy.mockResolvedValue([]);

      const result = await service.getApplicationFunnel({});

      expect(result.funnel[0]).toEqual({ stage: 'Viewed', count: 0 });
      expect(result.funnel[1]).toEqual({ stage: 'Applied', count: 10 });
    });
  });

  describe('getMonthlyTrends', () => {
    it('should return monthly trend data for default 6 months', async () => {
      mockPrisma.referral.findMany.mockResolvedValue([]);
      mockPrisma.referralApplication.findMany.mockResolvedValue([]);

      const result = await service.getMonthlyTrends({});

      expect(result.trends).toHaveLength(6);
      result.trends.forEach((bucket) => {
        expect(bucket).toHaveProperty('month');
        expect(bucket).toHaveProperty('referrals');
        expect(bucket).toHaveProperty('applications');
        expect(bucket).toHaveProperty('accepted');
        expect(bucket.referrals).toBe(0);
        expect(bucket.applications).toBe(0);
        expect(bucket.accepted).toBe(0);
      });
    });

    it('should aggregate data into correct monthly buckets', async () => {
      const now = new Date();
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 15);

      mockPrisma.referral.findMany.mockResolvedValue([
        { createdAt: thisMonth },
        { createdAt: thisMonth },
      ]);
      mockPrisma.referralApplication.findMany.mockResolvedValue([
        { createdAt: thisMonth, status: ApplicationStatus.PENDING },
        { createdAt: thisMonth, status: ApplicationStatus.ACCEPTED },
        { createdAt: thisMonth, status: ApplicationStatus.ACCEPTED },
      ]);

      const result = await service.getMonthlyTrends({ months: 6 });

      // The last bucket should contain this month's data
      const lastBucket = result.trends[result.trends.length - 1];
      expect(lastBucket.referrals).toBe(2);
      expect(lastBucket.applications).toBe(3);
      expect(lastBucket.accepted).toBe(2);
    });

    it('should support custom month range', async () => {
      mockPrisma.referral.findMany.mockResolvedValue([]);
      mockPrisma.referralApplication.findMany.mockResolvedValue([]);

      const result = await service.getMonthlyTrends({ months: 12 });

      expect(result.trends).toHaveLength(12);
    });

    it('should format month keys as YYYY-MM', async () => {
      mockPrisma.referral.findMany.mockResolvedValue([]);
      mockPrisma.referralApplication.findMany.mockResolvedValue([]);

      const result = await service.getMonthlyTrends({ months: 3 });

      result.trends.forEach((bucket) => {
        expect(bucket.month).toMatch(/^\d{4}-\d{2}$/);
      });
    });

    it('should respect dateFrom and dateTo when provided', async () => {
      const referralDate = new Date('2025-03-15');
      const appDate = new Date('2025-04-10');

      mockPrisma.referral.findMany.mockResolvedValue([
        { createdAt: referralDate },
      ]);
      mockPrisma.referralApplication.findMany.mockResolvedValue([
        { createdAt: appDate, status: ApplicationStatus.ACCEPTED },
      ]);

      const result = await service.getMonthlyTrends({
        dateFrom: '2025-03-01',
        dateTo: '2025-05-31',
      });

      // 3 months: March, April, May
      expect(result.trends).toHaveLength(3);
      expect(result.trends[0].month).toBe('2025-03');
      expect(result.trends[0].referrals).toBe(1);
      expect(result.trends[1].month).toBe('2025-04');
      expect(result.trends[1].applications).toBe(1);
      expect(result.trends[1].accepted).toBe(1);
      expect(result.trends[2].month).toBe('2025-05');
      expect(result.trends[2].referrals).toBe(0);
    });
  });

  describe('incrementViewCount', () => {
    it('should call prisma update with increment', async () => {
      mockPrisma.referral.update.mockResolvedValue({});

      await service.incrementViewCount('ref-1');

      expect(mockPrisma.referral.update).toHaveBeenCalledWith({
        where: { id: 'ref-1' },
        data: { viewCount: { increment: 1 } },
      });
    });
  });
});
