import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ApplicationStatus } from '@prisma/client';
import { AnalyticsQueryDto } from './dto/analytics-query.dto';

/**
 * Service for computing referral analytics.
 * Provides alumni-specific, student-specific, and platform-wide analytics
 * including application funnel data and monthly trend aggregation.
 */
@Injectable()
export class ReferralAnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Computes analytics for a specific alumni user.
   * Includes total referrals posted, applications received, conversion rates,
   * status breakdown, and top-performing referrals by application count.
   */
  async getAlumniAnalytics(alumniId: string, query: AnalyticsQueryDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: alumniId },
      select: { id: true, role: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const dateFilter = this.buildDateFilter(query);

    const [
      totalReferrals,
      totalApplications,
      applicationsByStatus,
      topReferrals,
      referralsByStatus,
    ] = await Promise.all([
      this.prisma.referral.count({
        where: { alumniId, ...dateFilter.referral },
      }),
      this.prisma.referralApplication.count({
        where: {
          referral: { alumniId },
          ...dateFilter.application,
        },
      }),
      this.prisma.referralApplication.groupBy({
        by: ['status'],
        where: {
          referral: { alumniId },
          ...dateFilter.application,
        },
        _count: { _all: true },
      }),
      this.prisma.referral.findMany({
        where: { alumniId, ...dateFilter.referral },
        select: {
          id: true,
          jobTitle: true,
          company: true,
          viewCount: true,
          _count: { select: { applications: true } },
        },
        orderBy: { applications: { _count: 'desc' } },
        take: 5,
      }),
      this.prisma.referral.groupBy({
        by: ['status'],
        where: { alumniId, ...dateFilter.referral },
        _count: { _all: true },
      }),
    ]);

    const statusBreakdown = this.mapStatusCounts(applicationsByStatus);
    const referralStatusBreakdown = Object.fromEntries(
      referralsByStatus.map((row) => [row.status, row._count._all]),
    );

    const accepted = statusBreakdown[ApplicationStatus.ACCEPTED] || 0;
    const conversionRate =
      totalApplications > 0
        ? Math.round((accepted / totalApplications) * 10000) / 100
        : 0;

    return {
      overview: {
        totalReferrals,
        totalApplications,
        conversionRate,
      },
      referralsByStatus: referralStatusBreakdown,
      applicationsByStatus: statusBreakdown,
      topReferrals: topReferrals.map((r) => ({
        id: r.id,
        jobTitle: r.jobTitle,
        company: r.company,
        viewCount: r.viewCount,
        applicationCount: r._count.applications,
      })),
    };
  }

  /**
   * Computes analytics for a specific student user.
   * Includes total applications submitted, acceptance rate, and status breakdown.
   */
  async getStudentAnalytics(studentId: string, query: AnalyticsQueryDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: studentId },
      select: { id: true, role: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const dateFilter = this.buildDateFilter(query);

    const [totalApplications, applicationsByStatus, recentApplications] =
      await Promise.all([
        this.prisma.referralApplication.count({
          where: { applicantId: studentId, ...dateFilter.application },
        }),
        this.prisma.referralApplication.groupBy({
          by: ['status'],
          where: { applicantId: studentId, ...dateFilter.application },
          _count: { _all: true },
        }),
        this.prisma.referralApplication.findMany({
          where: { applicantId: studentId, ...dateFilter.application },
          select: {
            id: true,
            status: true,
            createdAt: true,
            referral: {
              select: {
                jobTitle: true,
                company: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        }),
      ]);

    const statusBreakdown = this.mapStatusCounts(applicationsByStatus);
    const accepted = statusBreakdown[ApplicationStatus.ACCEPTED] || 0;
    const successRate =
      totalApplications > 0
        ? Math.round((accepted / totalApplications) * 10000) / 100
        : 0;

    return {
      overview: {
        totalApplications,
        successRate,
      },
      applicationsByStatus: statusBreakdown,
      recentApplications: recentApplications.map((app) => ({
        id: app.id,
        status: app.status,
        createdAt: app.createdAt,
        jobTitle: app.referral.jobTitle,
        company: app.referral.company,
      })),
    };
  }

  /**
   * Computes platform-wide analytics for admin users.
   * Includes total referrals, total applications, conversion rates,
   * top companies, referrals by status, and applications by status.
   */
  async getPlatformAnalytics(query: AnalyticsQueryDto) {
    const dateFilter = this.buildDateFilter(query);

    const [
      totalReferrals,
      totalApplications,
      referralsByStatus,
      applicationsByStatus,
      topCompanies,
      totalViews,
    ] = await Promise.all([
      this.prisma.referral.count({ where: dateFilter.referral }),
      this.prisma.referralApplication.count({
        where: dateFilter.application,
      }),
      this.prisma.referral.groupBy({
        by: ['status'],
        where: dateFilter.referral,
        _count: { _all: true },
      }),
      this.prisma.referralApplication.groupBy({
        by: ['status'],
        where: dateFilter.application,
        _count: { _all: true },
      }),
      this.prisma.referral.groupBy({
        by: ['company'],
        where: dateFilter.referral,
        _count: { company: true },
        orderBy: { _count: { company: 'desc' } },
        take: 10,
      }),
      this.prisma.referral.aggregate({
        where: dateFilter.referral,
        _sum: { viewCount: true },
      }),
    ]);

    const refStatusBreakdown = Object.fromEntries(
      referralsByStatus.map((row) => [row.status, row._count._all]),
    );
    const appStatusBreakdown = this.mapStatusCounts(applicationsByStatus);
    const accepted = appStatusBreakdown[ApplicationStatus.ACCEPTED] || 0;
    const conversionRate =
      totalApplications > 0
        ? Math.round((accepted / totalApplications) * 10000) / 100
        : 0;

    return {
      overview: {
        totalReferrals,
        totalApplications,
        totalViews: totalViews._sum.viewCount || 0,
        conversionRate,
      },
      referralsByStatus: refStatusBreakdown,
      applicationsByStatus: appStatusBreakdown,
      topCompanies: topCompanies.map((c) => ({
        company: c.company,
        count: c._count.company,
      })),
    };
  }

  /**
   * Computes the application funnel data.
   * Maps the stages: Viewed -> Applied -> Shortlisted -> Offered -> Accepted.
   */
  async getApplicationFunnel(query: AnalyticsQueryDto) {
    const dateFilter = this.buildDateFilter(query);

    const [totalViews, totalApplications, applicationsByStatus] =
      await Promise.all([
        this.prisma.referral.aggregate({
          where: dateFilter.referral,
          _sum: { viewCount: true },
        }),
        this.prisma.referralApplication.count({
          where: dateFilter.application,
        }),
        this.prisma.referralApplication.groupBy({
          by: ['status'],
          where: dateFilter.application,
          _count: { _all: true },
        }),
      ]);

    const statusCounts = this.mapStatusCounts(applicationsByStatus);

    const shortlisted = statusCounts[ApplicationStatus.SHORTLISTED] || 0;
    const offered = statusCounts[ApplicationStatus.OFFERED] || 0;
    const accepted = statusCounts[ApplicationStatus.ACCEPTED] || 0;

    const funnel = [
      {
        stage: 'Viewed',
        count: totalViews._sum.viewCount || 0,
      },
      {
        stage: 'Applied',
        count: totalApplications,
      },
      {
        stage: 'Shortlisted',
        count: shortlisted,
      },
      {
        stage: 'Offered',
        count: offered,
      },
      {
        stage: 'Accepted',
        count: accepted,
      },
    ];

    return { funnel };
  }

  /**
   * Computes monthly trend data for referrals and applications.
   * Returns counts aggregated by month for the specified number of past months,
   * or for the explicit date range when dateFrom/dateTo are provided.
   */
  async getMonthlyTrends(query: AnalyticsQueryDto) {
    // Determine the effective end date (inclusive)
    const endDate = query.dateTo ? new Date(query.dateTo) : new Date();
    endDate.setHours(23, 59, 59, 999);

    let months: number;
    let startDate: Date;

    if (query.dateFrom) {
      // Use the provided date range and derive the number of months from it
      startDate = new Date(query.dateFrom);
      startDate.setHours(0, 0, 0, 0);

      const yearDiff = endDate.getFullYear() - startDate.getFullYear();
      const monthDiff = endDate.getMonth() - startDate.getMonth();
      // +1 to make the range inclusive of both start and end months
      months = yearDiff * 12 + monthDiff + 1;

      if (months < 1) {
        months = 1;
      }
    } else {
      // Fallback to the original "last N months" behavior
      months = query.months || 6;
      startDate = new Date(endDate);
      startDate.setMonth(startDate.getMonth() - (months - 1));
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);
    }

    const [referrals, applications] = await Promise.all([
      this.prisma.referral.findMany({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        select: { createdAt: true },
      }),
      this.prisma.referralApplication.findMany({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        select: { createdAt: true, status: true },
      }),
    ]);

    const trends = this.aggregateByMonth(
      referrals,
      applications,
      months,
      startDate,
    );

    return { trends };
  }

  /**
   * Increments the view counter for a referral.
   * Used when a referral is viewed by a user.
   */
  async incrementViewCount(referralId: string): Promise<void> {
    await this.prisma.referral.update({
      where: { id: referralId },
      data: { viewCount: { increment: 1 } },
    });
  }

  // ─── Private Helpers ────────────────────────────────────────────────

  /**
   * Maps groupBy results into a record of status -> count.
   */
  private mapStatusCounts(
    rows: Array<{ status: ApplicationStatus; _count: { _all: number } }>,
  ): Record<string, number> {
    return Object.fromEntries(rows.map((row) => [row.status, row._count._all]));
  }

  /**
   * Builds Prisma date filters from the analytics query DTO.
   */
  private buildDateFilter(query: AnalyticsQueryDto): {
    referral: Record<string, any>;
    application: Record<string, any>;
  } {
    const referral: Record<string, any> = {};
    const application: Record<string, any> = {};

    if (query.dateFrom || query.dateTo) {
      const createdAt: Record<string, Date> = {};
      if (query.dateFrom) createdAt.gte = new Date(query.dateFrom);
      if (query.dateTo) createdAt.lte = new Date(query.dateTo);
      referral.createdAt = createdAt;
      application.createdAt = createdAt;
    }

    return { referral, application };
  }

  /**
   * Aggregates referral and application data into monthly buckets.
   */
  private aggregateByMonth(
    referrals: Array<{ createdAt: Date }>,
    applications: Array<{ createdAt: Date; status: ApplicationStatus }>,
    months: number,
    startDate: Date,
  ) {
    const buckets: Array<{
      month: string;
      referrals: number;
      applications: number;
      accepted: number;
    }> = [];

    for (let i = 0; i < months; i++) {
      const date = new Date(startDate);
      date.setMonth(date.getMonth() + i);
      const year = date.getFullYear();
      const month = date.getMonth();

      const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;

      const refCount = referrals.filter((r) => {
        const d = new Date(r.createdAt);
        return d.getFullYear() === year && d.getMonth() === month;
      }).length;

      const appCount = applications.filter((a) => {
        const d = new Date(a.createdAt);
        return d.getFullYear() === year && d.getMonth() === month;
      }).length;

      const acceptedCount = applications.filter((a) => {
        const d = new Date(a.createdAt);
        return (
          d.getFullYear() === year &&
          d.getMonth() === month &&
          a.status === ApplicationStatus.ACCEPTED
        );
      }).length;

      buckets.push({
        month: monthKey,
        referrals: refCount,
        applications: appCount,
        accepted: acceptedCount,
      });
    }

    return buckets;
  }
}
