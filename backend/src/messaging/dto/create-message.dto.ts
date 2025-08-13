import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

/**
 * Data transfer object for creating a new message.
 */
export class CreateMessageDto {
  /**
   * The unique identifier of the recipient user.
   * @example "clx0z0z0z0000000000000000"
   */
  @IsUUID()
  receiverId: string;

  /**
   * The content of the message.
   * Must not be empty.
   * @example "Hello, how are you?"
   */
  @IsString()
  @IsNotEmpty()
  content: string;
}
