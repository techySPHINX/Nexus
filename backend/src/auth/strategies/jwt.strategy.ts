import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

interface JwtPayload {
  sub: string;
  email: string;
  role: 'STUDENT' | 'ALUM' | 'ADMIN';
}

/**
 * JWT strategy that accepts tokens from:
 * 1. httpOnly `access_token` cookie (preferred — Issue #164)
 * 2. `Authorization: Bearer <token>` header (backwards-compatible for API / mobile clients)
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        // 1. Prefer httpOnly cookie
        (req: Request) => req?.cookies?.['access_token'] ?? null,
        // 2. Fall back to Authorization Bearer header
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
      passReqToCallback: false,
    });
  }

  async validate(payload: JwtPayload) {
    const allowedDomain = 'kiit.ac.in';
    const emailDomain = payload.email?.split('@')[1];

    if (emailDomain !== allowedDomain) {
      throw new UnauthorizedException(
        `Email domain must be '${allowedDomain}'`,
      );
    }

    return {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  }
}
