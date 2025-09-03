import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
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

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
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
  providers: [AppService],
})
export class AppModule {}
