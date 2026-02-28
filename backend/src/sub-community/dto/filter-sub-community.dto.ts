import { IsOptional, IsIn, IsInt, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class FilterSubCommunityDto extends PaginationDto {
  @IsOptional()
  @IsString()
  q?: string;

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
  @Type(() => Number)
  @IsInt()
  @Min(0)
  minMembers?: number;
}
