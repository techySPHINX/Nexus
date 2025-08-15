import { IsArray, IsOptional, IsString } from 'class-validator';

export class FilterProjectDto {
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @IsString()
  @IsOptional()
  sortBy?: 'supporters' | 'followers' | 'createdAt';

  @IsString()
  @IsOptional()
  search?: string;
}
