import { IsString, IsOptional, IsEnum, IsNumberString } from 'class-validator';
import { ReferralStatus } from '@prisma/client';

export class FilterReferralsDto {
  @IsString()
  @IsOptional()
  company?: string;

  @IsString()
  @IsOptional()
  jobTitle?: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsEnum(ReferralStatus)
  @IsOptional()
  status?: ReferralStatus;

  @IsNumberString()
  @IsOptional()
  skip?: number;

  @IsNumberString()
  @IsOptional()
  take?: number;
}
