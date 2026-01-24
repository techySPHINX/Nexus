import {
  IsArray,
  IsOptional,
  IsString,
  IsEnum,
  IsBoolean,
  IsNumber,
} from 'class-validator';
import { ProjectStatus } from '@prisma/client';
import { Transform, Type } from 'class-transformer';

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
  @Transform(({ value }) => value === 'true' || value === true)
  seekingCollaboration?: boolean;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  personalize?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  pageSize: number = 12;

  @IsOptional()
  @IsString()
  cursor?: string;
}
