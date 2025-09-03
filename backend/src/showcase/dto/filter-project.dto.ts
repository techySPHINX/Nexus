import {
  IsArray,
  IsOptional,
  IsString,
  IsEnum,
  IsBoolean,
} from 'class-validator';
import { ProjectStatus } from '@prisma/client';

export class FilterProjectDto {
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @IsString()
  @IsOptional()
  sortBy?: 'supporters' | 'followers' | 'createdAt' | 'updatedAt' | 'comments';

  @IsString()
  @IsOptional()
  search?: string;

  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  seeking?: string[];

  @IsOptional()
  @IsBoolean()
  personalize?: boolean;
}
