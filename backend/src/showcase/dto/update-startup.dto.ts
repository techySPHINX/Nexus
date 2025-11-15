import { IsString, IsOptional, IsUrl, IsEnum, IsNumber, IsArray } from 'class-validator';
import { StartupStatus } from '@prisma/client';

export class UpdateStartupDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUrl()
  imageUrl?: string;

  @IsOptional()
  @IsUrl()
  websiteUrl?: string;

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
  @IsArray()
  @IsString({ each: true })
  monetizationModel?: string[];
}
