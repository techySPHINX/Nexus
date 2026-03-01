import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Req,
  Res,
  Ip,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { RegisterWithDocumentsDto } from './dto/register-with-documents.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { EmailVerificationService } from './services/email-verification.service';
import { DocumentVerificationService } from './services/document-verification.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { GetCurrentUser } from '../common/decorators/get-current-user.decorator';
import { Request, Response } from 'express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

/**
 * Enhanced authentication controller with document verification
 * and comprehensive security features.
 */
@ApiTags('auth')
// Some endpoints in this controller require JWT (logout, logout-all, verify-document, etc.)
@ApiBearerAuth('JWT')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly emailVerificationService: EmailVerificationService,
    private readonly documentVerificationService: DocumentVerificationService,
  ) {}

  /** Write JWT tokens as httpOnly cookies on the response (Issue #164). */
  private setAuthCookies(res: Response, authResponse: AuthResponseDto): void {
    const isProduction = process.env.NODE_ENV === 'production';
    const cookieOptions = {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict' as const,
      path: '/',
    };

    res.cookie('access_token', authResponse.accessToken, {
      ...cookieOptions,
      maxAge: 60 * 60 * 1000, // 1 hour — aligned with JWT expiresIn (Copilot recommendation)
    });
    res.cookie('refresh_token', authResponse.refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/auth/refresh', // Restrict refresh token to the refresh endpoint
    });
  }

  /** Clear auth cookies on logout. */
  private clearAuthCookies(res: Response): void {
    res.clearCookie('access_token', { path: '/' });
    res.clearCookie('refresh_token', { path: '/auth/refresh' });
  }

  /**
   * Register with document verification (for students/alumni)
   */
  @Post('register-with-documents')
  async registerWithDocuments(
    @Body() dto: RegisterWithDocumentsDto,
    @Ip() ip: string,
    @Req() req: Request,
  ): Promise<{ message: string }> {
    const userAgent = req.headers['user-agent'] || '';
    return this.authService.registerWithDocuments(dto, ip, userAgent);
  }

  /**
   * Regular registration (legacy support) — sets httpOnly auth cookies.
   */
  @Post('register')
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseDto> {
    const result = await this.authService.register(dto);
    this.setAuthCookies(res, result);
    return result;
  }

  /**
   * Enhanced login with security tracking — sets httpOnly auth cookies.
   */
  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Ip() ip: string,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseDto> {
    const userAgent = req.headers['user-agent'] || '';
    const result = await this.authService.login(dto, ip, userAgent);
    this.setAuthCookies(res, result);
    return result;
  }

  /**
   * Refresh access token — rotates both cookies.
   */
  @Post('refresh')
  async refreshToken(
    @Body() dto: RefreshTokenDto,
    @Ip() ip: string,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseDto> {
    const userAgent = req.headers['user-agent'] || '';
    const result = await this.authService.refreshToken(dto, ip, userAgent);
    this.setAuthCookies(res, result);
    return result;
  }

  /**
   * Logout from current device — clears auth cookies and invalidates refresh token.
   *
   * This endpoint is intentionally NOT protected by JwtAuthGuard so that users
   * can always log out and clear cookies, even if their access token has expired
   * (Copilot recommendation from PR #210).
   */
  @Post('logout')
  async logout(
    @Body() body: { refreshToken?: string },
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ message: string }> {
    // Support both body-provided token and cookie-based token for backwards compat.
    const refreshToken =
      body.refreshToken ??
      (req.cookies?.['refresh_token'] as string | undefined);
    this.clearAuthCookies(res);
    if (refreshToken) {
      return this.authService.logout(refreshToken);
    }
    return { message: 'Logged out successfully' };
  }

  /**
   * Logout from all devices — clears auth cookies.
   */
  @Post('logout-all')
  @UseGuards(JwtAuthGuard)
  async logoutAll(
    @GetCurrentUser('sub') userId: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ message: string }> {
    this.clearAuthCookies(res);
    return this.authService.logoutAll(userId);
  }

  /**
   * Verify email address
   */
  @Post('verify-email')
  async verifyEmail(
    @Body() body: { token: string },
  ): Promise<{ message: string }> {
    return this.emailVerificationService.verifyEmail(body.token);
  }

  /**
   * Resend verification email
   */
  @Post('resend-verification')
  async resendVerification(
    @Body() body: { email: string; name: string },
  ): Promise<{ message: string }> {
    return this.emailVerificationService.sendVerificationEmail(
      body.email,
      body.name,
    );
  }

  /**
   * Get pending documents for admin review
   */
  @Get('admin/pending-documents')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async getPendingDocuments() {
    return this.documentVerificationService.getPendingDocuments();
  }

  /**
   * Approve user documents (Admin only)
   */
  @Post('admin/approve-documents')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async approveDocuments(
    @Body()
    body: {
      documentIds: string[];
      adminComments?: string;
    },
    @GetCurrentUser('sub') adminId: string,
  ): Promise<{ message: string }> {
    return this.documentVerificationService.approveDocuments(
      body.documentIds,
      adminId,
      body.adminComments,
    );
  }

  /**
   * Reject user documents (Admin only)
   */
  @Post('admin/reject-documents')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async rejectDocuments(
    @Body()
    body: {
      documentIds: string[];
      reason: string;
      adminComments?: string;
    },
    @GetCurrentUser('sub') adminId: string,
  ): Promise<{ message: string }> {
    return this.documentVerificationService.rejectDocuments(
      body.documentIds,
      adminId,
      body.reason,
      body.adminComments,
    );
  }

  /**
   * Get current user's document verification status
   */
  @Get('document-status')
  @UseGuards(JwtAuthGuard)
  async getDocumentStatus(@GetCurrentUser('sub') userId: string) {
    return this.documentVerificationService.getUserDocumentStatus(userId);
  }

  /**
   * Health check endpoint
   */
  @Get('test')
  async test() {
    return { message: 'Enhanced auth controller is working' };
  }
}
