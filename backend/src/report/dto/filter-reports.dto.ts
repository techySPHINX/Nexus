import {
  IsOptional,
  IsEnum,
  IsDateString,
  IsString,
  IsUUID,
} from 'class-validator';
import { ReportedContentType, ReportStatus } from '@prisma/client';

export class FilterReportsDto {
  @IsOptional()
  @IsEnum(ReportedContentType)
  type?: ReportedContentType;

  @IsOptional()
  @IsEnum(ReportStatus)
  status?: ReportStatus;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsUUID()
  reporterId?: string;

  @IsOptional()
  @IsUUID()
  subCommunityId?: string;

  @IsOptional()
  @IsUUID()
  handlerId?: string;

  @IsOptional()
  @IsString()
  searchTerm?: string;
}
