import { IsEnum, IsNotEmpty } from 'class-validator';
import { ReportStatus } from '@prisma/client';

export class UpdateReportDto {
  @IsEnum(ReportStatus)
  @IsNotEmpty()
  status: ReportStatus;
}
