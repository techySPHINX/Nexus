import {
  Controller,
  Post,
  Body,
  Get,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ResendVerificationDto } from './dto/resend-email-verification.dto';

/**
 * Controller responsible for handling authentication-related requests.
 * Provides endpoints for user registration and login.
 */
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Registers a new user.
   * @param dto - The data required to register a new user.
   * @returns A promise that resolves to an authentication response, including a JWT token.
   */
  @Post('register')
  async register(@Body() dto: RegisterDto): Promise<AuthResponseDto> {
    return this.authService.register(dto);
  }

  /**
   * Logs in an existing user.
   * @param dto - The data required to log in a user.
   * @returns A promise that resolves to an authentication response, including a JWT token.
   */
  @Post('login')
  async login(@Body() dto: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(dto);
  }

  /**
   * Verifies a user's email using a verification token.
   * @param dto - The data required to verify the email, including the token.
   * @returns A promise that resolves when the email has been successfully verified.
   */
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto);
  }

  /**
   * Resends the email verification token to the user's email address.
   * @param email - The email address of the user to resend the verification token to.
   * @returns A promise that resolves when the verification email has been sent.
   */
  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  async resendVerification(@Body() dto: ResendVerificationDto) {
    return this.authService.resendVerification(dto);
  }

  /**
   * A test endpoint to check if the controller is working.
   * @returns A promise that resolves to a simple message.
   */
  @Get('test')
  async test() {
    return { message: 'Auth controller is working' };
  }
}
