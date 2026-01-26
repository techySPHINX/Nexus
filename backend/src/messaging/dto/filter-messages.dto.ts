import { IsOptional, IsInt, Min, Max, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Data transfer object for filtering messages in a conversation.
 * Used for pagination and filtering.
 */
export class FilterMessagesDto {
  /**
   * The number of messages to skip (for pagination).
   * @example 0
   */
  @ApiPropertyOptional({
    description: 'Number of messages to skip (offset)',
    minimum: 0,
    default: 0,
    example: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  skip?: number = 0;

  /**
   * The maximum number of messages to take (for pagination).
   * @example 20
   */
  @ApiPropertyOptional({
    description: 'Maximum number of messages to return',
    minimum: 1,
    maximum: 100,
    default: 20,
    example: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  take?: number = 20;

  /**
   * Optional: Filter messages before this timestamp
   * @example "2024-01-01T00:00:00.000Z"
   */
  @ApiPropertyOptional({
    description: 'Filter messages before this timestamp (ISO 8601)',
    example: '2024-01-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  before?: string;

  /**
   * Optional: Filter messages after this timestamp
   * @example "2024-01-01T00:00:00.000Z"
   */
  @ApiPropertyOptional({
    description: 'Filter messages after this timestamp (ISO 8601)',
    example: '2024-01-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  after?: string;
}
