import { Module } from '@nestjs/common';
import { ConnectionService } from './connection.service';
import { ConnectionController } from './connection.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { NotificationService } from 'src/notification/notification.service';
import { MessagingModule } from '../messaging/messaging.module';
import { GamificationModule } from 'src/gamification/gamification.module';

@Module({
  imports: [MessagingModule, GamificationModule],
  controllers: [ConnectionController],
  providers: [ConnectionService, PrismaService, NotificationService],
  exports: [ConnectionService],
})
export class ConnectionModule {}
