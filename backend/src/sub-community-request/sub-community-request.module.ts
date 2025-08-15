import { Module } from '@nestjs/common';
import { SubCommunityRequestService } from './sub-community-request.service';
import { SubCommunityRequestController } from './sub-community-request.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { SubCommunityModule } from '../sub-community/sub-community.module';
@Module({
  imports: [PrismaModule, SubCommunityModule],
  providers: [SubCommunityRequestService],
  controllers: [SubCommunityRequestController],
  exports: [SubCommunityRequestService],
})
export class SubCommunityRequestModule {}
