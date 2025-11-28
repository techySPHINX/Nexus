import { Module } from '@nestjs/common';
import { ReferralController } from './referral.controller';
import { ReferralService } from './referral.service';
import { NotificationModule } from 'src/notification/notification.module';
import { FilesModule } from 'src/files/files.module';
import { EmailModule } from 'src/email/email.module';
import { ReferralGateway } from './referral.gateway';
import { ReferralExpiryService } from './referral.expiry.service';
import { GamificationModule } from 'src/gamification/gamification.module';

@Module({
  imports: [NotificationModule, FilesModule, EmailModule, GamificationModule],
  controllers: [ReferralController],
  providers: [ReferralService, ReferralGateway, ReferralExpiryService],
})
export class ReferralModule {}
