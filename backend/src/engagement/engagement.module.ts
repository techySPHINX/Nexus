import { Module } from '@nestjs/common';
import { EngagementService } from './engagement.service';
import { EngagementController } from './engagement.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { NotificationModule } from 'src/notification/notification.module';
import { GamificationModule } from 'src/gamification/gamification.module';

@Module({
  imports: [PrismaModule, NotificationModule, GamificationModule],
  controllers: [EngagementController],
  providers: [EngagementService],
})
export class EngagementModule {}
