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
