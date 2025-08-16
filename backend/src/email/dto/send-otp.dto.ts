import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

/**
 * Data transfer object for sending an OTP (One-Time Password) email.
 */
export class SendOtpDto {
  /**
   * The recipient's email address.
   * @example "user@example.com"
   */
  @IsEmail()
  email: string;

  /**
   * The OTP code to be sent.
   * @example "123456"
   */
  @IsString()
  @IsNotEmpty()
  otp: string;

  /**
   * The name of the recipient, used for personalization in the email.
   * @example "John Doe"
   */
  @IsString()
  @IsNotEmpty()
  name: string;
}
