import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class DeleteMessageDto {
  @IsNotEmpty()
  @IsUUID()
  @IsString()
  messageId: string;
}
