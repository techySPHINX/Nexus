import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { ReferralStatus } from '@prisma/client';

export class UpdateReferralDto {
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  company?: string;

  @IsString()
  @IsOptional()
  @IsNotEmpty()
  jobTitle?: string;

  @IsString()
  @IsOptional()
  @IsNotEmpty()
  description?: string;

  @IsString()
  @IsOptional()
  @IsNotEmpty()
  requirements?: string;

  @IsString()
  @IsOptional()
  @IsNotEmpty()
  location?: string;

  @IsEnum(ReferralStatus)
  @IsOptional()
  status?: ReferralStatus;
}
