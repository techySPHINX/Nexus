import { IsNotEmpty, IsString, IsUUID, MinLength } from 'class-validator';

export class EditMessageDto {
  @IsNotEmpty()
  @IsUUID()
  @IsString()
  messageId: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(1)
  content: string;
}
