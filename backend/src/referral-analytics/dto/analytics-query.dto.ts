import { IsOptional, IsDateString, IsInt, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * DTO for analytics query parameters.
 * Supports date-range filtering and pagination for trend data.
 */
export class AnalyticsQueryDto {
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  @Max(24)
  months?: number = 6;
}
