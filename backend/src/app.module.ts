import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
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
import { securityConfig } from './common/config/security.config';
import { WinstonLoggerService } from './common/logger/winston-logger.service';
import { AuditLogService } from './common/services/audit-log.service';
import { GdprService } from './common/services/gdpr.service';
import { RedisService } from './common/services/redis.service';
import { CachingService } from './common/services/caching.service';
import { RateLimitService } from './common/guards/enhanced-rate-limit.guard';
import { FileSecurityService } from './common/services/file-security.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      {
        ttl: securityConfig.rateLimit.ttl, // seconds as configured in security.config
        limit: securityConfig.rateLimit.limit,
      },
    ]),
    PrismaModule,
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
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Global Services - Logging & Audit
    WinstonLoggerService,
    AuditLogService,
    // Global Services - Data & Privacy
    GdprService,
    // Global Services - Caching & Performance
    RedisService,
    CachingService,
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
    CachingService,
    RateLimitService,
    FileSecurityService,
  ],
})
export class AppModule { }
