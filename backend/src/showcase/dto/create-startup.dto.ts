import { IsString, IsUrl, IsOptional, IsEnum, IsNumber } from 'class-validator';
import { StartupStatus } from '@prisma/client';

export class CreateStartupDto {
  @IsString()
  name: string;

  @IsString()
  description: string;

  @IsUrl()
  imageUrl: string;

  @IsUrl()
  websiteUrl: string;

  @IsOptional()
  @IsEnum(StartupStatus)
  status?: StartupStatus;

  @IsOptional()
  @IsNumber()
  fundingGoal?: number;

  @IsOptional()
  @IsNumber()
  fundingRaised?: number;

  @IsOptional()
  @IsString()
  monetizationModel?: string;
}
