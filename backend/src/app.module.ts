import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { ConnectionService } from './connection/connection.service';
import { ConnectionController } from './connection/connection.controller';
import { ConnectionModule } from './connection/connection.module';
import { MessagingService } from './messaging/messaging.service';
import { MessagingController } from './messaging/messaging.controller';
import { MessagingModule } from './messaging/messaging.module';
import { NotificationController } from './notification/notification.controller';
import { NotificationService } from './notification/notification.service';
import { NotificationModule } from './notification/notification.module';
import { PostService } from './post/post.service';
import { PostController } from './post/post.controller';
import { PostModule } from './post/post.module';
import { EngagementController } from './engagement/engagement.controller';
// import { EngagementModule } from './engagement/engagement.module';
import { EngagementService } from './engagement/engagement.service';

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
    // EngagementModule,
  ],
  controllers: [
    AppController,
    ConnectionController,
    MessagingController,
    NotificationController,
    PostController,
    EngagementController,
  ],
  providers: [
    AppService,
    ConnectionService,
    MessagingService,
    NotificationService,
    PostService,
    EngagementService,
  ],
})
export class AppModule {}
