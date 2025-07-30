import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any) {
    if (err || !user) {
      throw err || new UnauthorizedException('Authentication failed');
    }

    const allowedDomain = 'kiit.ac.in';
    const emailDomain = user.email?.split('@')[1];
    if (emailDomain !== allowedDomain) {
      throw new UnauthorizedException(
        `Email domain must be '${allowedDomain}'`,
      );
    }

    return user;
  }
}
