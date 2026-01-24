import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';
import { RegisterWithDocumentsDto } from './dto/register-with-documents.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { TokenService } from './services/token.service';
import { EmailVerificationService } from './services/email-verification.service';
import { RateLimitService } from './services/rate-limit.service';
import { DocumentVerificationService } from './services/document-verification.service';
import { Role } from '@prisma/client';

const ALLOWED_DOMAIN = 'kiit.ac.in';

/**
 * Enhanced authentication service with document verification,
 * rate limiting, and comprehensive security features.
 */
@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly tokenService: TokenService,
    private readonly emailVerificationService: EmailVerificationService,
    private readonly rateLimitService: RateLimitService,
    private readonly documentVerificationService: DocumentVerificationService,
  ) { }

  /**
   * Enhanced registration with document verification for students/alumni
   */
  async registerWithDocuments(
    dto: RegisterWithDocumentsDto,
    ipAddress: string,
    userAgent: string,
  ): Promise<{ message: string }> {
    // Check domain
    const domain = dto.email.split('@')[1];
    if (domain !== ALLOWED_DOMAIN) {
      throw new ForbiddenException(
        `Email must belong to domain ${ALLOWED_DOMAIN}`,
      );
    }

    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new BadRequestException('Email already registered');
    }

    // Create user with pending status (no password yet)
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        name: dto.name,
        role: dto.role,
        graduationYear: dto.graduationYear || null,
        accountStatus: 'PENDING_DOCUMENT_REVIEW' as any,
        isEmailVerified: false,
        isAccountActive: false,
        profile: {
          create: {
            studentId: dto.studentId || null,
            dept: dto.department || null,
            bio: '',
            location: '',
            interests: '',
            avatarUrl: '',
          },
        },
      },
      include: { profile: true },
    });

    // Submit documents for verification
    await this.documentVerificationService.submitDocuments(
      user.id,
      dto.documents,
    );

    // Log security event
    await this.logSecurityEvent(user.id, 'DOCUMENT_UPLOADED', {
      ipAddress,
      userAgent,
      documentCount: dto.documents.length,
    });

    return {
      message:
        'Registration submitted successfully. Your documents will be reviewed by our admin team. You will receive login credentials via email once approved.',
    };
  }

  /**
   * Regular registration (for cases where documents aren't required)
   */
  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    const domain = dto.email.split('@')[1];
    if (domain !== ALLOWED_DOMAIN) {
      throw new ForbiddenException(
        `Email must belong to domain ${ALLOWED_DOMAIN}`,
      );
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new BadRequestException('Email already registered');
    }

    const hash = await bcrypt.hash(dto.password, 12); // Increased salt rounds

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hash,
        name: dto.name,
        role: dto.role || Role.STUDENT,
        accountStatus: 'PENDING_VERIFICATION' as any,
        isEmailVerified: false,
        isAccountActive: false,
        profile: {
          create: {
            bio: '',
            location: '',
            interests: '',
            avatarUrl: '',
          },
        },
      },
      include: { profile: true },
    });

    // Send verification email
    await this.emailVerificationService.sendVerificationEmail(
      user.email,
      user.name || 'User',
    );

    return this.signTokenPair(user);
  }

  /**
   * Enhanced login with rate limiting and security checks
   */
  async login(
    dto: LoginDto,
    ipAddress: string,
    userAgent: string,
  ): Promise<AuthResponseDto> {
    if (await this.rateLimitService.isIpRateLimited(ipAddress)) {
      throw new BadRequestException(
        'Too many failed attempts from this IP. Please try again later.',
      );
    }

    // Check if account is locked
    if (await this.rateLimitService.isAccountLocked(dto.email)) {
      await this.rateLimitService.recordLoginAttempt(
        dto.email,
        ipAddress,
        userAgent,
        false,
      );
      throw new UnauthorizedException(
        'Account is temporarily locked due to too many failed login attempts.',
      );
    }

    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: {
        id: true,
        email: true,
        password: true,
        isAccountActive: true,
        name: true,
        role: true,
        isEmailVerified: true,
        accountStatus: true,
        profile: {
          select: {
            avatarUrl: true,
            skills: { select: { name: true }, take: 10},
            gender: true,
          },
        },
      },
    });

    if (!user || !user.password) {
      await this.rateLimitService.recordLoginAttempt(
        dto.email,
        ipAddress,
        userAgent,
        false,
      );
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if account is active
    if (!user.isAccountActive) {
      throw new UnauthorizedException(
        'Account is not yet activated. Please wait for admin approval.',
      );
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      await this.rateLimitService.recordLoginAttempt(
        dto.email,
        ipAddress,
        userAgent,
        false,
      );
      throw new UnauthorizedException('Invalid credentials');
    }

    // Reset failed attempts on successful login
    await this.rateLimitService.resetFailedAttempts(dto.email);

    // Record successful login
    await this.rateLimitService.recordLoginAttempt(
      dto.email,
      ipAddress,
      userAgent,
      true,
    );

    // Log security event
    await this.logSecurityEvent(user.id, 'LOGIN_SUCCESS', {
      ipAddress,
      userAgent,
    });

    return this.signTokenPair({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
      accountStatus: user.accountStatus,
      profile: user.profile,
      gender: user.profile?.gender,
    },
      ipAddress, userAgent);
  }

  /**
   * Refresh access token
   */
  async refreshToken(
    dto: RefreshTokenDto,
    ipAddress: string,
    userAgent: string,
  ): Promise<AuthResponseDto> {
    const tokenData = await this.tokenService.validateRefreshToken(
      dto.refreshToken,
    );

    if (!tokenData) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Revoke old token
    await this.tokenService.revokeRefreshToken(dto.refreshToken);

    // Generate new token pair
    return this.signTokenPair(tokenData.user, ipAddress, userAgent);
  }

  /**
   * Logout and revoke tokens
   */
  async logout(refreshToken: string): Promise<{ message: string }> {
    if (refreshToken) {
      await this.tokenService.revokeRefreshToken(refreshToken);
    }

    return { message: 'Logged out successfully' };
  }

  /**
   * Logout from all devices
   */
  async logoutAll(userId: string): Promise<{ message: string }> {
    await this.tokenService.revokeAllUserTokens(userId);

    // Log security event
    await this.logSecurityEvent(userId, 'LOGOUT', {
      type: 'all_devices',
    });

    return { message: 'Logged out from all devices successfully' };
  }

  /**
   * Generate access and refresh token pair
   */
  private async signTokenPair(
    user: any,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<AuthResponseDto> {
    const payload = {
      sub: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isEmailVerified: user.isEmailVerified || false,
      accountStatus: user.accountStatus || 'PENDING_VERIFICATION',
      profile: user.profile || null,
    };

    const accessToken = this.jwt.sign(payload, { expiresIn: '1hr' });
    const refreshToken = this.tokenService.generateRefreshToken();

    // Store refresh token
    await this.tokenService.storeRefreshToken(
      user.id,
      refreshToken,
      userAgent,
      ipAddress,
    );

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isEmailVerified: user.isEmailVerified || false,
        accountStatus: user.accountStatus || 'PENDING_VERIFICATION',
        profileCompleted: !!user.profile,
        profile: user.profile || null,
      },
      expiresIn: 60 * 60, // 1 hour in seconds
    };
  }

  /**
   * Log security event
   */
  private async logSecurityEvent(
    userId: string,
    eventType: string,
    metadata: any,
  ) {
    try {
      await this.prisma.securityEvent.create({
        data: {
          userId,
          eventType: eventType as any,
          ipAddress: metadata.ipAddress || 'unknown',
          userAgent: metadata.userAgent,
          metadata,
        },
      });
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }
}
