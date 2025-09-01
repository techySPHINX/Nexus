import { PartialType } from '@nestjs/mapped-types';
import { CreateSubCommunityDto } from './create-sub-community.dto';
import { IsOptional, IsString } from 'class-validator';

export class UpdateSubCommunityDto extends PartialType(CreateSubCommunityDto) {
  // All fields are optional for update
  @IsString()
  @IsOptional()
  bannerUrl?: string;

  @IsString()
  @IsOptional()
  iconUrl?: string;
}
