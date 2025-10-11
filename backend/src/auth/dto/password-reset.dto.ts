import { IsEmail, IsNotEmpty } from 'class-validator';

/**
 * DTO for requesting password reset
 */
export class ForgotPasswordDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;
}

/**
 * DTO for resetting password with token
 */
export class ResetPasswordDto {
  @IsNotEmpty()
  token: string;

  @IsNotEmpty()
  newPassword: string;
}
