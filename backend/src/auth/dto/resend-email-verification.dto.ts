import { IsEmail, IsNotEmpty } from 'class-validator';

export class ResendVerificationDto {
  /**
   * The user's email address.
   * @example "test@kiit.ac.in"
   */
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
