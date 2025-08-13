import {
  IsOptional,
  IsBoolean,
  IsString,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

/**
 * Data transfer object for querying notifications.
 * Provides options for pagination, filtering by read status, and notification type.
 */
export class NotificationQueryDto {
  /**
   * The page number for pagination.
   * Must be an integer greater than or equal to 1.
   * @example 1
   */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  /**
   * The number of notifications to return per page.
   * Must be an integer between 1 and 100.
   * @example 20
   */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  /**
   * If true, only unread notifications will be returned.
   * @example false
   */
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  unreadOnly?: boolean = false;

  /**
   * Optional. Filter notifications by their type.
   * @example "CONNECTION_REQUEST"
   */
  @IsOptional()
  @IsString()
  type?: string;
}
