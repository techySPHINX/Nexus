import { IsEnum, IsOptional } from 'class-validator';
import { ApplicationStatus } from '@prisma/client';

export class UpdateReferralApplicationDto {
  @IsEnum(ApplicationStatus)
  @IsOptional()
  status?: ApplicationStatus;
}
