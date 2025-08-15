import { Module } from '@nestjs/common';
import { SubCommunityService } from './sub-community.service';
import { SubCommunityController } from './sub-community.controller';

@Module({
  controllers: [SubCommunityController],
  providers: [SubCommunityService],
})
export class SubCommunityModule {}
