import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { ReportedContentType } from '@prisma/client';

export class CreateReportDto {
  @IsEnum(ReportedContentType)
  @IsNotEmpty()
  type: ReportedContentType;

  @IsString()
  @IsNotEmpty()
  reason: string;

  @IsUUID()
  @IsOptional()
  postId?: string;

  @IsUUID()
  @IsOptional()
  commentId?: string;

  @IsUUID()
  @IsOptional()
  projectId?: string;

  @IsUUID()
  @IsOptional()
  startupId?: string;

  @IsUUID()
  @IsOptional()
  subCommunityId?: string;

  @IsUUID()
  @IsOptional()
  userId?: string;
}
