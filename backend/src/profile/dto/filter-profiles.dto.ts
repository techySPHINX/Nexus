import {
  IsOptional,
  IsString,
  IsArray,
  IsNumber,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Role } from '@prisma/client';

/**
 * Data transfer object for filtering profiles.
 */
export class FilterProfilesDto {
  /**
   * Filter by user name (case-insensitive, partial match).
   * @example "John"
   */
  @IsOptional()
  @IsString()
  name?: string;

  /**
   * Filter by user email (case-insensitive, partial match).
   * @example "john.doe@example.com"
   */
  @IsOptional()
  @IsString()
  email?: string;

  /**
   * Filter by user roles.
   * @example ["STUDENT", "ALUM"]
   */
  @IsOptional()
  @IsEnum(Role, { each: true })
  @IsArray()
  roles?: Role[];

  /**
   * Filter by profile location (case-insensitive, partial match).
   * @example "New York"
   */
  @IsOptional()
  @IsString()
  location?: string;

  /**
   * Filter by skills (case-insensitive, partial match for each skill).
   * @example ["JavaScript", "React"]
   */
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skills?: string[];

  /**
   * Filter by department (case-insensitive, partial match).
   * @example "Computer Science"
   */
  @IsOptional()
  @IsString()
  dept?: string;

  /**
   * Filter by year (case-insensitive, partial match).
   * @example "3"
   */
  @IsOptional()
  @IsString()
  year?: string;

  /**
   * Filter by branch (case-insensitive, partial match).
   * @example "B.Tech"
   */
  @IsOptional()
  @IsString()
  branch?: string;

  /**
   * Filter by course (case-insensitive, partial match).
   * @example "Software Engineering"
   */
  @IsOptional()
  @IsString()
  course?: string;

  /**
   * Number of records to skip for pagination.
   * @example 0
   */
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  skip?: number;

  /**
   * Number of records to take for pagination.
   * @example 10
   */
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  take?: number;
}
