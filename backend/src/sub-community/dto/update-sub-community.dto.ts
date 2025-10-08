import { PartialType } from '@nestjs/mapped-types';
import { CreateSubCommunityDto } from './create-sub-community.dto';
import { IsOptional, IsString } from 'class-validator';

export class UpdateSubCommunityDto extends PartialType(CreateSubCommunityDto) {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  type?: string;

  @IsOptional()
  isPrivate?: boolean;

  @IsString()
  @IsOptional()
  ownerId?: string;

  @IsString()
  @IsOptional()
  bannerUrl?: string;

  @IsString()
  @IsOptional()
  iconUrl?: string;
}
