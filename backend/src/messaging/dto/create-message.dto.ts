import {
  IsNotEmpty,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Data transfer object for creating a new message.
 */
export class CreateMessageDto {
  /**
   * The unique identifier of the recipient user.
   * @example "clx0z0z0z0000000000000000"
   */
  @ApiProperty({
    description: 'The UUID of the recipient user',
    example: 'clx0z0z0z0000000000000000',
    format: 'uuid',
  })
  @IsUUID(4, { message: 'receiverId must be a valid UUID' })
  receiverId: string;

  /**
   * The content of the message.
   * Must not be empty and between 1 and 5000 characters.
   * @example "Hello, how are you?"
   */
  @ApiProperty({
    description: 'The message content',
    example: 'Hello, how are you?',
    minLength: 1,
    maxLength: 5000,
  })
  @IsString()
  @IsNotEmpty({ message: 'Message content cannot be empty' })
  @MinLength(1, { message: 'Message must be at least 1 character long' })
  @MaxLength(5000, { message: 'Message cannot exceed 5000 characters' })
  content: string;
}
