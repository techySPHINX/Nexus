import {
  IsString,
  IsEnum,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

export enum NotificationType {
  CONNECTION_REQUEST = 'CONNECTION_REQUEST',
  CONNECTION_ACCEPTED = 'CONNECTION_ACCEPTED',
  POST_LIKE = 'POST_LIKE',
  POST_COMMENT = 'POST_COMMENT',
  MESSAGE = 'MESSAGE',
  SYSTEM = 'SYSTEM',
  EVENT = 'EVENT',
}

export class CreateSystemNotificationDto {
  @IsUUID()
  userId: string;

  @IsString()
  @MinLength(1)
  @MaxLength(500)
  message: string;

  @IsEnum(NotificationType)
  type: NotificationType;
}
