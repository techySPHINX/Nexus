import { IsOptional, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Data transfer object for filtering messages in a conversation.
 * Used for pagination.
 */
export class FilterMessagesDto {
  /**
   * The number of messages to skip (for pagination).
   * @example 0
   */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  skip?: number;

  /**
   * The maximum number of messages to take (for pagination).
   * @example 20
   */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  take?: number;
}
