import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from './strategies/jwt.strategy';
import { TokenService } from './services/token.service';
import { EmailVerificationService } from './services/email-verification.service';
import { RateLimitService } from './services/rate-limit.service';
import { DocumentVerificationService } from './services/document-verification.service';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [
    ConfigModule,
    EmailModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: '15m', // Shorter access token expiry
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    TokenService,
    EmailVerificationService,
    RateLimitService,
    DocumentVerificationService,
  ],
  exports: [
    AuthService,
    TokenService,
    EmailVerificationService,
    RateLimitService,
    DocumentVerificationService,
  ],
})
export class AuthModule {}
