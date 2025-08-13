import { IsEnum, IsOptional } from 'class-validator';
import { ApplicationStatus } from '@prisma/client';

/**
 * Data transfer object for updating a referral application.
 */
export class UpdateReferralApplicationDto {
  /**
   * Optional. The new status for the referral application.
   * @example "APPROVED"
   */
  @IsEnum(ApplicationStatus)
  @IsOptional()
  status?: ApplicationStatus;
}
