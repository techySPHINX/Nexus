import { Module } from '@nestjs/common';
import { SubCommunityService } from './sub-community.service';
import { SubCommunityController } from './sub-community.controller';
import { SubCommunityTypeService } from './sub-community-type.service';
import { SubCommunityTypeController } from './sub-community-type.controller';

@Module({
  controllers: [SubCommunityController, SubCommunityTypeController],
  providers: [SubCommunityService, SubCommunityTypeService],
  exports: [SubCommunityService, SubCommunityTypeService],
})
export class SubCommunityModule {}
