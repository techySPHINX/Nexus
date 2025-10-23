import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Req,
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
import { Request } from 'express';

/**
 * Enhanced authentication controller with document verification
 * and comprehensive security features.
 */
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly emailVerificationService: EmailVerificationService,
    private readonly documentVerificationService: DocumentVerificationService,
  ) {}

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
   * Regular registration (legacy support)
   */
  @Post('register')
  async register(@Body() dto: RegisterDto): Promise<AuthResponseDto> {
    return this.authService.register(dto);
  }

  /**
   * Enhanced login with security tracking
   */
  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Ip() ip: string,
    @Req() req: Request,
  ): Promise<AuthResponseDto> {
    const userAgent = req.headers['user-agent'] || '';
    return this.authService.login(dto, ip, userAgent);
  }

  /**
   * Refresh access token
   */
  @Post('refresh')
  async refreshToken(
    @Body() dto: RefreshTokenDto,
    @Ip() ip: string,
    @Req() req: Request,
  ): Promise<AuthResponseDto> {
    const userAgent = req.headers['user-agent'] || '';
    return this.authService.refreshToken(dto, ip, userAgent);
  }

  /**
   * Logout from current device
   */
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(
    @Body() body: { refreshToken: string },
  ): Promise<{ message: string }> {
    return this.authService.logout(body.refreshToken);
  }

  /**
   * Logout from all devices
   */
  @Post('logout-all')
  @UseGuards(JwtAuthGuard)
  async logoutAll(
    @GetCurrentUser('sub') userId: string,
  ): Promise<{ message: string }> {
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
