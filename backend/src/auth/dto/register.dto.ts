import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  MinLength,
} from 'class-validator';
import { Role } from '@prisma/client';

/**
 * Data transfer object for user registration.
 */
export class RegisterDto {
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

  /**
   * The user's name.
   * @example "John Doe"
   */
  @IsNotEmpty()
  name: string;

  /**
   * The user's role.
   * @example "STUDENT"
   */
  @IsOptional()
  @IsEnum(Role)
  role?: Role;
}
