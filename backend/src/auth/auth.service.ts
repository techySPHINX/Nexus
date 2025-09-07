import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { Role } from '@prisma/client';
import { EmailService } from 'src/email/email.service';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ResendVerificationDto } from './dto/resend-email-verification.dto';

const ALLOWED_DOMAIN = 'kiit.ac.in';

/**
 * Service responsible for handling authentication logic,
 * including user registration, login, and JWT token generation.
 */
@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly emailService: EmailService,
  ) {}

  /**
   * Registers a new user.
   *
   * @param dto - The data required to register a new user.
   * @returns A promise that resolves to an authentication response, including a JWT token.
   * @throws {ForbiddenException} If the email does not belong to the allowed domain.
   * @throws {BadRequestException} If the email is already registered.
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

    const hash = await bcrypt.hash(dto.password, 10);

    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
    const verificationTokenExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hash,
        name: dto.name,
        role: dto.role || Role.STUDENT,
        emailVerified: false,
        verificationToken: otp,
        verificationTokenExpires,
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

    await this.emailService.sendOtp({
      email: user.email,
      otp,
      name: user.name,
    });

    return this.signToken(user);
  }

  /**
   * Logs in an existing user.
   *
   * @param dto - The data required to log in a user.
   * @returns A promise that resolves to an authentication response, including a JWT token.
   * @throws {UnauthorizedException} If the credentials are invalid.
   */
  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // this needs to be checked
    if (!user.emailVerified) {
      throw new UnauthorizedException('Email not verified');
    }

    return this.signToken(user);
  }

  async verifyEmail(dto: VerifyEmailDto): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.emailVerified) {
      throw new BadRequestException('Email already verified');
    }

    if (!user.verificationToken || !user.verificationTokenExpires) {
      throw new BadRequestException('No verification token found');
    }

    if (user.verificationTokenExpires < new Date()) {
      throw new BadRequestException('Verification token expired');
    }

    if (user.verificationToken !== dto.otp) {
      throw new BadRequestException('Invalid verification token');
    }

    await this.prisma.user.update({
      where: { email: dto.email },
      data: {
        emailVerified: true,
        verificationToken: null,
        verificationTokenExpires: null,
      },
    });

    return { message: 'Email verified successfully' };
  }

  async resendVerification(
    dto: ResendVerificationDto,
  ): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.emailVerified) {
      throw new BadRequestException('Email already verified');
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationTokenExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    await this.prisma.user.update({
      where: { email: dto.email },
      data: {
        verificationToken: otp,
        verificationTokenExpires,
      },
    });

    await this.emailService.sendOtp({
      email: user.email,
      otp,
      name: user.name,
    });

    return { message: 'Verification email resent successfully' };
  }

  /**
   * Generates a JWT token for the given user.
   *
   * @param user - The user object for whom the token should be generated.
   * @returns An authentication response containing the JWT token and user information.
   */
  private signToken(user: any): AuthResponseDto {
    const payload = {
      sub: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      emailVerified: user.emailVerified,
      profileCompleted: user.profileCompleted,
    };

    const token = this.jwt.sign(payload);

    return {
      accessToken: token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        emailVerified: user.emailVerified,
        profileCompleted: user.profileCompleted,
      },
    };
  }
}
