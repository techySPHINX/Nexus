import { IsBoolean } from 'class-validator';

/**
 * Data transfer object for updating a notification's read status.
 */
export class UpdateNotificationDto {
  /**
   * The read status of the notification.
   * `true` for read, `false` for unread.
   * @example true
   */
  @IsBoolean()
  read: boolean;
}
