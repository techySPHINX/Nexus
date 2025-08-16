import { Module } from '@nestjs/common';
import { GamificationService } from './gamification.service';
import { GamificationController } from './gamification.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [GamificationController],
  providers: [GamificationService, PrismaService],
  exports: [GamificationService],
})
export class GamificationModule {}
