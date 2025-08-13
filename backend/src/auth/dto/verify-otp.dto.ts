import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator';

/**
 * Data transfer object for verifying OTP.
 */
export class VerifyOtpDto {
  /**
   * The user's email address.
   * @example "test@kiit.ac.in"
   */
  @IsEmail()
  @IsNotEmpty()
  email: string;

  /**
   * The 6-digit OTP code.
   * @example "123456"
   */
  @IsString()
  @IsNotEmpty()
  @Length(6, 6)
  otp: string;
}
