import { IsString, IsUrl, IsOptional, IsEnum, IsNumber, IsArray } from 'class-validator';
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

  /** startup status
   * IDEA: "IDEA";
   * PROTOTYPING: "PROTOTYPING";
   * BETA: "BETA";
   * LAUNCHED: "LAUNCHED";
   */
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
