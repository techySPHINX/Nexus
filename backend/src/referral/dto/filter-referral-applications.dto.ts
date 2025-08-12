import { IsString, IsOptional, IsEnum, IsNumberString } from 'class-validator';
import { ApplicationStatus } from '@prisma/client';

export class FilterReferralApplicationsDto {
  @IsString()
  @IsOptional()
  referralId?: string;

  @IsString()
  @IsOptional()
  studentId?: string;

  @IsEnum(ApplicationStatus)
  @IsOptional()
  status?: ApplicationStatus;

  @IsNumberString()
  @IsOptional()
  skip?: number;

  @IsNumberString()
  @IsOptional()
  take?: number;
}
