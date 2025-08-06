import { IsString, IsOptional, IsUUID } from 'class-validator';

export class CreateNotificationDto {
  @IsUUID()
  userId: string;

  @IsString()
  message: string;

  @IsOptional()
  @IsString()
  type?: string; // e.g., "MESSAGE", "CONNECTION", "EVENT"
}
