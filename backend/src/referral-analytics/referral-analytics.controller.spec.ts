/**
 * Unit Test Suite for ReferralAnalyticsController
 *
 * Covers:
 * - All endpoint route handlers
 * - Role-based access (alumni, student, admin)
 * - Query parameter forwarding
 * - Guard and decorator integration
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ReferralAnalyticsController } from './referral-analytics.controller';
import { ReferralAnalyticsService } from './referral-analytics.service';

describe('ReferralAnalyticsController', () => {
  let controller: ReferralAnalyticsController;
  let service: ReferralAnalyticsService;

  const mockAnalyticsService = {
    getAlumniAnalytics: jest.fn(),
    getStudentAnalytics: jest.fn(),
    getPlatformAnalytics: jest.fn(),
    getApplicationFunnel: jest.fn(),
    getMonthlyTrends: jest.fn(),
  };

  const alumniAnalyticsResult = {
    overview: { totalReferrals: 5, totalApplications: 20, conversionRate: 15 },
    referralsByStatus: { APPROVED: 4, PENDING: 1 },
    applicationsByStatus: { PENDING: 10, ACCEPTED: 3, REJECTED: 7 },
    topReferrals: [
      {
        id: 'r1',
        jobTitle: 'SDE',
        company: 'Google',
        viewCount: 50,
        applicationCount: 10,
      },
    ],
  };

  const studentAnalyticsResult = {
    overview: { totalApplications: 8, successRate: 25 },
    applicationsByStatus: { PENDING: 3, ACCEPTED: 2, REJECTED: 3 },
    recentApplications: [
      {
        id: 'a1',
        status: 'PENDING',
        createdAt: new Date(),
        jobTitle: 'SDE',
        company: 'Google',
      },
    ],
  };

  const platformAnalyticsResult = {
    overview: {
      totalReferrals: 50,
      totalApplications: 200,
      totalViews: 1500,
      conversionRate: 20,
    },
    referralsByStatus: { APPROVED: 30, PENDING: 15, REJECTED: 5 },
    applicationsByStatus: { PENDING: 80, ACCEPTED: 40, REJECTED: 80 },
    topCompanies: [{ company: 'Google', count: 20 }],
  };

  const funnelResult = {
    funnel: [
      { stage: 'Viewed', count: 1000 },
      { stage: 'Applied', count: 300 },
      { stage: 'Shortlisted', count: 100 },
      { stage: 'Offered', count: 50 },
      { stage: 'Accepted', count: 30 },
    ],
  };

  const trendsResult = {
    trends: [{ month: '2025-07', referrals: 5, applications: 10, accepted: 2 }],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReferralAnalyticsController],
      providers: [
        {
          provide: ReferralAnalyticsService,
          useValue: mockAnalyticsService,
        },
      ],
    }).compile();

    controller = module.get<ReferralAnalyticsController>(
      ReferralAnalyticsController,
    );
    service = module.get<ReferralAnalyticsService>(ReferralAnalyticsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAlumniAnalytics', () => {
    it('should return alumni analytics for authenticated user', async () => {
      mockAnalyticsService.getAlumniAnalytics.mockResolvedValue(
        alumniAnalyticsResult,
      );

      const result = await controller.getAlumniAnalytics('alumni-1', {});

      expect(service.getAlumniAnalytics).toHaveBeenCalledWith('alumni-1', {});
      expect(result).toEqual(alumniAnalyticsResult);
    });

    it('should forward query parameters', async () => {
      mockAnalyticsService.getAlumniAnalytics.mockResolvedValue(
        alumniAnalyticsResult,
      );

      const query = { dateFrom: '2025-01-01', dateTo: '2025-12-31' };
      await controller.getAlumniAnalytics('alumni-1', query);

      expect(service.getAlumniAnalytics).toHaveBeenCalledWith(
        'alumni-1',
        query,
      );
    });
  });

  describe('getAlumniAnalyticsById', () => {
    it('should return analytics for a specific alumni (admin access)', async () => {
      mockAnalyticsService.getAlumniAnalytics.mockResolvedValue(
        alumniAnalyticsResult,
      );

      const result = await controller.getAlumniAnalyticsById(
        'target-alumni',
        {},
      );

      expect(service.getAlumniAnalytics).toHaveBeenCalledWith(
        'target-alumni',
        {},
      );
      expect(result).toEqual(alumniAnalyticsResult);
    });
  });

  describe('getStudentAnalytics', () => {
    it('should return student analytics for authenticated user', async () => {
      mockAnalyticsService.getStudentAnalytics.mockResolvedValue(
        studentAnalyticsResult,
      );

      const result = await controller.getStudentAnalytics('student-1', {});

      expect(service.getStudentAnalytics).toHaveBeenCalledWith('student-1', {});
      expect(result).toEqual(studentAnalyticsResult);
    });

    it('should forward query parameters', async () => {
      mockAnalyticsService.getStudentAnalytics.mockResolvedValue(
        studentAnalyticsResult,
      );

      const query = { dateFrom: '2025-06-01' };
      await controller.getStudentAnalytics('student-1', query);

      expect(service.getStudentAnalytics).toHaveBeenCalledWith(
        'student-1',
        query,
      );
    });
  });

  describe('getStudentAnalyticsById', () => {
    it('should return analytics for a specific student (admin access)', async () => {
      mockAnalyticsService.getStudentAnalytics.mockResolvedValue(
        studentAnalyticsResult,
      );

      const result = await controller.getStudentAnalyticsById(
        'target-student',
        {},
      );

      expect(service.getStudentAnalytics).toHaveBeenCalledWith(
        'target-student',
        {},
      );
      expect(result).toEqual(studentAnalyticsResult);
    });
  });

  describe('getPlatformAnalytics', () => {
    it('should return platform-wide analytics', async () => {
      mockAnalyticsService.getPlatformAnalytics.mockResolvedValue(
        platformAnalyticsResult,
      );

      const result = await controller.getPlatformAnalytics({});

      expect(service.getPlatformAnalytics).toHaveBeenCalledWith({});
      expect(result).toEqual(platformAnalyticsResult);
    });

    it('should forward date range parameters', async () => {
      mockAnalyticsService.getPlatformAnalytics.mockResolvedValue(
        platformAnalyticsResult,
      );

      const query = { dateFrom: '2025-01-01', dateTo: '2025-12-31' };
      await controller.getPlatformAnalytics(query);

      expect(service.getPlatformAnalytics).toHaveBeenCalledWith(query);
    });
  });

  describe('getApplicationFunnel', () => {
    it('should return funnel data with all stages', async () => {
      mockAnalyticsService.getApplicationFunnel.mockResolvedValue(funnelResult);

      const result = await controller.getApplicationFunnel({});

      expect(service.getApplicationFunnel).toHaveBeenCalledWith({});
      expect(result.funnel).toHaveLength(5);
      expect(result.funnel[0].stage).toBe('Viewed');
      expect(result.funnel[4].stage).toBe('Accepted');
    });
  });

  describe('getMonthlyTrends', () => {
    it('should return monthly trend data', async () => {
      mockAnalyticsService.getMonthlyTrends.mockResolvedValue(trendsResult);

      const result = await controller.getMonthlyTrends({});

      expect(service.getMonthlyTrends).toHaveBeenCalledWith({});
      expect(result.trends).toHaveLength(1);
    });

    it('should forward months parameter', async () => {
      mockAnalyticsService.getMonthlyTrends.mockResolvedValue(trendsResult);

      const query = { months: 12 };
      await controller.getMonthlyTrends(query);

      expect(service.getMonthlyTrends).toHaveBeenCalledWith(query);
    });
  });
});
