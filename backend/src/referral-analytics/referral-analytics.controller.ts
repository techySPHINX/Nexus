import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ReferralAnalyticsService } from './referral-analytics.service';
import { AnalyticsQueryDto } from './dto/analytics-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { GetCurrentUser } from '../common/decorators/get-current-user.decorator';
import { Role } from '@prisma/client';
import { SkipThrottle } from '@nestjs/throttler';

/**
 * Controller for referral analytics endpoints.
 * Provides role-based analytics views for alumni, students, and admins.
 * All endpoints are protected by JWT authentication and role-based guards.
 */
@Controller('referral-analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@SkipThrottle()
export class ReferralAnalyticsController {
  constructor(private readonly analyticsService: ReferralAnalyticsService) {}

  /**
   * Returns analytics for the authenticated alumni user.
   * Includes referral performance, application counts, and conversion rates.
   */
  @Get('alumni')
  @Roles(Role.ALUM, Role.ADMIN)
  async getAlumniAnalytics(
    @GetCurrentUser('userId') userId: string,
    @Query() query: AnalyticsQueryDto,
  ) {
    return this.analyticsService.getAlumniAnalytics(userId, query);
  }

  /**
   * Returns analytics for a specific alumni user (admin access).
   */
  @Get('alumni/:id')
  @Roles(Role.ADMIN)
  async getAlumniAnalyticsById(
    @Param('id') alumniId: string,
    @Query() query: AnalyticsQueryDto,
  ) {
    return this.analyticsService.getAlumniAnalytics(alumniId, query);
  }

  /**
   * Returns analytics for the authenticated student user.
   * Includes application success rates and status breakdown.
   */
  @Get('student')
  @Roles(Role.STUDENT, Role.ADMIN)
  async getStudentAnalytics(
    @GetCurrentUser('userId') userId: string,
    @Query() query: AnalyticsQueryDto,
  ) {
    return this.analyticsService.getStudentAnalytics(userId, query);
  }

  /**
   * Returns analytics for a specific student user (admin access).
   */
  @Get('student/:id')
  @Roles(Role.ADMIN)
  async getStudentAnalyticsById(
    @Param('id') studentId: string,
    @Query() query: AnalyticsQueryDto,
  ) {
    return this.analyticsService.getStudentAnalytics(studentId, query);
  }

  /**
   * Returns platform-wide analytics (admin only).
   * Includes total referrals, applications, conversion rates, and top companies.
   */
  @Get('platform')
  @Roles(Role.ADMIN)
  async getPlatformAnalytics(@Query() query: AnalyticsQueryDto) {
    return this.analyticsService.getPlatformAnalytics(query);
  }

  /**
   * Returns application funnel data for visualization.
   * Stages: Viewed > Applied > Shortlisted > Offered > Accepted
   * Admin-only to avoid exposing platform-wide volumes to non-admin users.
   */
  @Get('funnel')
  @Roles(Role.ADMIN)
  async getApplicationFunnel(@Query() query: AnalyticsQueryDto) {
    return this.analyticsService.getApplicationFunnel(query);
  }

  /**
   * Returns monthly platform-wide trend data for referrals and applications.
   * Supports configurable lookback period via query.months (default: 6).
   * Admin-only to avoid exposing global usage metrics to non-admin users.
   */
  @Get('trends')
  @Roles(Role.ADMIN)
  async getMonthlyTrends(@Query() query: AnalyticsQueryDto) {
    return this.analyticsService.getMonthlyTrends(query);
  }
}
