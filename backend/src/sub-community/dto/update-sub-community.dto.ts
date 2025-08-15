import { PartialType } from '@nestjs/mapped-types';
import { CreateSubCommunityDto } from './create-sub-community.dto';

export class UpdateSubCommunityDto extends PartialType(CreateSubCommunityDto) {}
