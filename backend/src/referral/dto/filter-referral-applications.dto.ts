import { IsString, IsOptional, IsEnum, IsNumberString } from 'class-validator';
import { ApplicationStatus } from '@prisma/client';

/**
 * Data transfer object for filtering referral applications.
 */
export class FilterReferralApplicationsDto {
  /**
   * Optional. Filter applications by the ID of the referral they are for.
   * @example "clx0z0z0z0000000000000000"
   */
  @IsString()
  @IsOptional()
  referralId?: string;

  /**
   * Optional. Filter applications by the ID of the student who applied.
   * @example "clx0z0z0z0000000000000000"
   */
  @IsString()
  @IsOptional()
  studentId?: string;

  /**
   * Optional. Filter applications by their current status.
   * @example "PENDING"
   */
  @IsEnum(ApplicationStatus)
  @IsOptional()
  status?: ApplicationStatus;

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
