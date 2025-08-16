import {
  IsString,
  IsEnum,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

/**
 * Enum for different types of notifications.
 * This enum is duplicated from notification.service.ts for DTO validation purposes.
 */
export enum NotificationType {
  CONNECTION_REQUEST = 'CONNECTION_REQUEST',
  CONNECTION_ACCEPTED = 'CONNECTION_ACCEPTED',
  POST_LIKE = 'POST_LIKE',
  POST_COMMENT = 'POST_COMMENT',
  MESSAGE = 'MESSAGE',
  SYSTEM = 'SYSTEM',
  EVENT = 'EVENT',
}

/**
 * Data transfer object for creating a new system notification.
 * This DTO is specifically for system-generated notifications where the type is explicitly defined.
 */
export class CreateSystemNotificationDto {
  /**
   * The ID of the user who will receive the system notification.
   * @example "clx0z0z0z0000000000000000"
   */
  @IsUUID()
  userId: string;

  /**
   * The message content of the system notification.
   * Must be between 1 and 500 characters long.
   * @example "Your account has been successfully verified."
   */
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  message: string;

  /**
   * The type of the system notification.
   * Must be one of the values defined in the `NotificationType` enum.
   * @example "SYSTEM"
   */
  @IsEnum(NotificationType)
  type: NotificationType;
}
