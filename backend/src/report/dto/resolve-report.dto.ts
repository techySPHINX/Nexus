import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ReportStatus } from '@prisma/client';

export class ResolveReportDto {
  @IsEnum(ReportStatus)
  @IsNotEmpty()
  action: ReportStatus; // ADDRESSED or DISMISSED

  @IsString()
  @IsNotEmpty()
  @MinLength(10, { message: 'Resolution reason must be at least 10 characters' })
  @MaxLength(1000, { message: 'Resolution reason cannot exceed 1000 characters' })
  reason: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000, { message: 'Notes cannot exceed 2000 characters' })
  notes?: string;
}
