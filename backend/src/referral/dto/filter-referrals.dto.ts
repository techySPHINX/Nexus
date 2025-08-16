import { IsString, IsOptional, IsEnum, IsNumberString } from 'class-validator';
import { ReferralStatus } from '@prisma/client';

/**
 * Data transfer object for filtering job referrals.
 */
export class FilterReferralsDto {
  /**
   * Optional. Filter referrals by company name (case-insensitive, partial match).
   * @example "Google"
   */
  @IsString()
  @IsOptional()
  company?: string;

  /**
   * Optional. Filter referrals by job title (case-insensitive, partial match).
   * @example "Software Engineer"
   */
  @IsString()
  @IsOptional()
  jobTitle?: string;

  /**
   * Optional. Filter referrals by location (case-insensitive, partial match).
   * @example "Remote"
   */
  @IsString()
  @IsOptional()
  location?: string;

  /**
   * Optional. Filter referrals by their status.
   * @example "ACTIVE"
   */
  @IsEnum(ReferralStatus)
  @IsOptional()
  status?: ReferralStatus;

  /**
   * Optional. The number of records to skip for pagination.
   * @example 0
   */
  @IsNumberString()
  @IsOptional()
  skip?: number;

  /**
   * Optional. The number of records to take for pagination.
   * @example 10
   */
  @IsNumberString()
  @IsOptional()
  take?: number;
}
