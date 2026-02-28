import { IsOptional, IsIn, IsNumberString, IsString } from 'class-validator';

export class FilterSubCommunityDto {
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsNumberString()
  page?: string;

  @IsOptional()
  @IsNumberString()
  limit?: string;

  @IsOptional()
  @IsIn(['public', 'private', 'all'])
  privacy?: string;

  @IsOptional()
  @IsIn(['joined', 'all'])
  membership?: string;

  @IsOptional()
  @IsIn(['recent', 'popular', 'active'])
  sort?: string;

  @IsOptional()
  @IsNumberString()
  minMembers?: string;
}
