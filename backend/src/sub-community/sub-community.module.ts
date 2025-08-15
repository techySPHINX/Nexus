import { Module } from '@nestjs/common';
import { SubCommunityService } from './sub-community.service';
import { SubCommunityController } from './sub-community.controller';

@Module({
  controllers: [SubCommunityController],
  providers: [SubCommunityService],
  exports: [SubCommunityService],
})
export class SubCommunityModule {}
