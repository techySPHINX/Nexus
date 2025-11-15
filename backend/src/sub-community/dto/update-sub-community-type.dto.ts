import { IsString, IsOptional } from 'class-validator';

export class UpdateSubCommunityTypeDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  description?: string;
}
