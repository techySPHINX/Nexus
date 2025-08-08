import { Module } from '@nestjs/common';
import { EngagementService } from './engagement.service';
import { EngagementController } from './engagement.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [EngagementController],
  providers: [EngagementService],
})
export class EngagementModule {}
