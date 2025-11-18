import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class MessageReadDto {
  @IsNotEmpty()
  @IsUUID()
  @IsString()
  messageId: string;
}
