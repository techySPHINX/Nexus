import { IsString, IsNotEmpty, IsDateString, IsOptional, IsUrl } from 'class-validator';

/**
 * Data transfer object for creating a new job referral.
 */
export class CreateReferralDto {
  /**
   * The name of the company offering the referral.
   * @example "Tech Solutions Inc."
   */
  @IsString()
  @IsNotEmpty()
  company: string;

  /**
   * The job title for the referral.
   * @example "Software Engineer"
   */
  @IsString()
  @IsNotEmpty()
  jobTitle: string;

  /**
   * A detailed description of the job and referral.
   * @example "Seeking a highly motivated software engineer to join our team..."
   */
  @IsString()
  @IsNotEmpty()
  description: string;

  /**
   * The requirements for the job.
   * @example "Bachelor's degree in Computer Science, 3+ years of experience..."
   */
  @IsString()
  @IsNotEmpty()
  requirements: string;

  /**
   * The location of the job (e.g., city, state, remote).
   * @example "San Francisco, CA" or "Remote"
   */
  @IsString()
  @IsNotEmpty()
  location: string;

  /**
   * The application deadline for the referral (ISO 8601 date string).
   * @example "2024-12-31T23:59:59.000Z"
   */
  @IsOptional()
  @IsDateString()
  deadline?: string;

  /**
   * The direct link to the referral or job posting.
   * @example "https://company.com/job/123"
   */
  @IsOptional()
  @IsUrl()
  referralLink?: string;
}
