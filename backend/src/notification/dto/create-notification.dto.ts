import {
  IsString,
  IsOptional,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

/**
 * Data transfer object for creating a new notification.
 */
export class CreateNotificationDto {
  /**
   * The ID of the user who will receive the notification.
   * @example "clx0z0z0z0000000000000000"
   */
  @IsUUID()
  userId: string;

  /**
   * The message content of the notification.
   * Must be between 1 and 500 characters long.
   * @example "You have a new connection request from John Doe."
   */
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  message: string;

  /**
   * Optional. The type of the notification.
   * This can be used for categorization and different display logic on the frontend.
   * @example "CONNECTION_REQUEST"
   */
  @IsOptional()
  @IsString()
  type?: string; // e.g., "MESSAGE", "CONNECTION", "EVENT"
}
