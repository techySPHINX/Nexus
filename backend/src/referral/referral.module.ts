import { Module } from '@nestjs/common';
import { ReferralController } from './referral.controller';
import { ReferralService } from './referral.service';
import { NotificationModule } from 'src/notification/notification.module';
import { FilesModule } from 'src/files/files.module';

@Module({
  imports: [NotificationModule, FilesModule],
  controllers: [ReferralController],
  providers: [ReferralService],
})
export class ReferralModule {}
