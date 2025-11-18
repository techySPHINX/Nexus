import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ReferralStatus } from '@prisma/client';

@Injectable()
export class ReferralExpiryService implements OnModuleInit {
  private readonly logger = new Logger(ReferralExpiryService.name);

  constructor(private readonly prisma: PrismaService) {}

  onModuleInit() {
    // Run once on startup, then every 15 minutes
    this.expirePastDeadlines().catch((e) =>
      this.logger.error('Initial expiry check failed', e),
    );
    setInterval(() => {
      this.expirePastDeadlines().catch((e) =>
        this.logger.error('Scheduled expiry check failed', e),
      );
    }, 15 * 60 * 1000);
  }

  private async expirePastDeadlines() {
    const now = new Date();
    const result = await this.prisma.referral.updateMany({
      where: {
        deadline: { lt: now },
        status: { in: [ReferralStatus.PENDING, ReferralStatus.APPROVED] },
      },
      data: { status: ReferralStatus.REJECTED },
    });
    if (result.count > 0) {
      this.logger.log(`Auto-expired ${result.count} referrals past deadline`);
    }
  }
}
