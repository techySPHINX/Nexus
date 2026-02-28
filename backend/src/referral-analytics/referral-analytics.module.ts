import { Module } from '@nestjs/common';
import { ReferralAnalyticsController } from './referral-analytics.controller';
import { ReferralAnalyticsService } from './referral-analytics.service';

@Module({
  controllers: [ReferralAnalyticsController],
  providers: [ReferralAnalyticsService],
  exports: [ReferralAnalyticsService],
})
export class ReferralAnalyticsModule {}
