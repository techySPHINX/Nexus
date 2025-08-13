import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateReferralApplicationDto {
  @IsString()
  @IsNotEmpty()
  referralId: string;

  @IsString()
  @IsNotEmpty()
  resumeFile: string; // This will be the path to the uploaded file

  @IsString()
  @IsOptional()
  coverLetter?: string;
}
