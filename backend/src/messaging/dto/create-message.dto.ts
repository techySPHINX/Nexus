import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreateMessageDto {
  @IsUUID()
  receiverId: string;

  @IsString()
  @IsNotEmpty()
  content: string;
}
