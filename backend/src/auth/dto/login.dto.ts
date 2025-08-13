import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

/**
 * Data transfer object for user login.
 */
export class LoginDto {
  /**
   * The user's email address.
   * @example "test@kiit.ac.in"
   */
  @IsEmail()
  @IsNotEmpty()
  email: string;

  /**
   * The user's password.
   * @example "password123"
   */
  @MinLength(6)
  @IsNotEmpty()
  password: string;
}
