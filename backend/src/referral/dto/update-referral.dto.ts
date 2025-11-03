
import { IsString, IsNotEmpty, IsOptional, IsEnum, IsDateString, IsUrl } from 'class-validator';
import { ReferralStatus } from '@prisma/client';

/**
 * Data transfer object for updating an existing job referral.
 */
export class UpdateReferralDto {
  /**
   * Optional. The updated company name for the referral.
   * @example "New Tech Corp"
   */
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  company?: string;

  /**
   * Optional. The updated job title for the referral.
   * @example "Senior Software Engineer"
   */
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  jobTitle?: string;

  /**
   * Optional. The updated detailed description of the job and referral.
   * @example "Updated description: Seeking a highly experienced software engineer..."
   */
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  description?: string;

  /**
   * Optional. The updated requirements for the job.
   * @example "Master's degree in Computer Science, 5+ years of experience..."
   */
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  requirements?: string;

  /**
   * Optional. The updated location of the job.
   * @example "London, UK"
   */
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  location?: string;

  /**
   * Optional. The updated status of the referral.
   * @example "CLOSED"
   */
  @IsEnum(ReferralStatus)
  @IsOptional()
  status?: ReferralStatus;

  /**
   * Optional. The updated application deadline for the referral (ISO 8601 date string).
   * @example "2024-12-31T23:59:59.000Z"
   */
  @IsOptional()
  @IsDateString()
  deadline?: string;

  /**
   * Optional. The updated direct link to the referral or job posting.
   * @example "https://company.com/job/123"
   */
  @IsOptional()
  @IsUrl()
  referralLink?: string;
}
