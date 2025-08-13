import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

/**
 * Data transfer object for creating a new referral application.
 */
export class CreateReferralApplicationDto {
  /**
   * The ID of the referral to which the application is being made.
   * @example "clx0z0z0z0000000000000000"
   */
  @IsString()
  @IsNotEmpty()
  referralId: string;

  /**
   * The URL or path to the uploaded resume file.
   * This field is typically populated after the file is uploaded and processed.
   * @example "https://example.com/resume.pdf"
   */
  @IsString()
  @IsNotEmpty()
  resumeFile: string; // This will be the path to the uploaded file

  /**
   * Optional. The content of the cover letter for the application.
   * @example "Dear Hiring Manager, I am writing to express my interest..."
   */
  @IsString()
  @IsOptional()
  coverLetter?: string;
}
