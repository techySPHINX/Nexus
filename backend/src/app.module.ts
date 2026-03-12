import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { CommonModule } from './common/common.module';
import { AuthModule } from './auth/auth.module';
import { AdminModule } from './admin/admin.module';
import { UserModule } from './user/user.module';
import { ConnectionModule } from './connection/connection.module';
import { MessagingModule } from './messaging/messaging.module';
import { NotificationModule } from './notification/notification.module';
import { PostModule } from './post/post.module';
import { ProfileModule } from './profile/profile.module';
import { EngagementModule } from './engagement/engagement.module';
import { ReferralModule } from './referral/referral.module';
import { FilesModule } from './files/files.module';
import { MentorshipModule } from './mentorship/mentorship.module';
import { SubCommunityModule } from './sub-community/sub-community.module';
import { SubCommunityRequestModule } from './sub-community-request/sub-community-request.module';
import { GamificationModule } from './gamification/gamification.module';
import { ReportModule } from './report/report.module';
import { EventsModule } from './events/events.module';
import { ShowcaseModule } from './showcase/showcase.module';
import { NewsModule } from './news/news.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { ReferralAnalyticsModule } from './referral-analytics/referral-analytics.module';
import { HealthModule } from './health/health.module';
import { MetricsModule } from './metrics/metrics.module';
import { securityConfig } from './common/config/security.config';
import { envValidationSchema } from './common/config/env.validation';
import { WinstonLoggerService } from './common/logger/winston-logger.service';
import { AuditLogService } from './common/services/audit-log.service';
import { GdprService } from './common/services/gdpr.service';
import { RedisService } from './common/services/redis.service';
import { RateLimitService } from './common/guards/enhanced-rate-limit.guard';
import { FileSecurityService } from './common/services/file-security.service';
import { CsrfMiddleware } from './common/middleware/csrf.middleware';
import { FrontendErrorController } from './common/controllers/frontend-error.controller';

@Module({
  imports: [
    /**
     * ConfigModule with Joi validation (Issue #165).
     * The app will refuse to start — with a clear error — if any required
     * environment variable (DATABASE_URL, JWT_SECRET, etc.) is missing.
     */
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
      validationOptions: {
        allowUnknown: true,
        abortEarly: false,
      },
    }),
    ThrottlerModule.forRoot([
      {
        ttl: securityConfig.rateLimit.ttl, // seconds as configured in security.config
        limit: securityConfig.rateLimit.limit,
      },
    ]),
    PrismaModule,
    CommonModule, // Global common services including CacheService
    AuthModule,
    AdminModule,
    UserModule,
    ConnectionModule,
    MessagingModule,
    NotificationModule,
    PostModule,
    ProfileModule,
    EngagementModule,
    ReferralModule,
    FilesModule,
    MentorshipModule,
    SubCommunityModule,
    SubCommunityRequestModule,
    GamificationModule,
    ReportModule,
    EventsModule,
    ShowcaseModule,
    NewsModule,
    DashboardModule,
    ReferralAnalyticsModule,
    HealthModule,
    MetricsModule,
  ],
  controllers: [AppController, FrontendErrorController],
  providers: [
    AppService,
    // Global Services - Logging & Audit
    WinstonLoggerService,
    AuditLogService,
    // Global Services - Data & Privacy
    GdprService,
    // Global Services - Caching & Performance
    // NOTE: CacheService is the canonical cache service, provided by CommonModule
    // (which is @Global). CachingService and CacheEnhancedService are legacy;
    // do not register them here to avoid duplicate instances (Issue #170).
    RedisService,
    // Global Services - Security
    RateLimitService,
    FileSecurityService,
    // Global Rate Limiting Guard
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
  exports: [
    WinstonLoggerService,
    AuditLogService,
    GdprService,
    RedisService,
    RateLimitService,
    FileSecurityService,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply CSRF protection to all routes.
    // CsrfMiddleware whitelists safe HTTP methods (GET/HEAD/OPTIONS) and
    // a few exempt paths (/health, /ready, /auth/google) internally.
    consumer.apply(CsrfMiddleware).forRoutes('*');
  }
}
