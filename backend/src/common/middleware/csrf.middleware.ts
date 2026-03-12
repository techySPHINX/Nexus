import {
  Injectable,
  NestMiddleware,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as crypto from 'crypto';

/**
 * CSRF protection middleware using the Double-Submit Cookie pattern.
 *
 * - On every request this middleware ensures a `csrf-token` cookie exists
 *   (generating one if absent).
 * - For state-changing methods (POST, PUT, PATCH, DELETE) it requires the
 *   `X-CSRF-Token` request header to match the cookie value.
 * - JSON API endpoints with Bearer-token auth are inherently CSRF-resistant;
 *   this layer adds defence-in-depth and will be essential after the JWT
 *   storage is migrated to httpOnly cookies (Issue #164).
 *
 * Excluded from CSRF validation:
 *  - GET / HEAD / OPTIONS (safe methods)
 *  - Paths under /auth/google (OAuth redirect flow)
 *  - /health and /ready (monitoring)
 */
@Injectable()
export class CsrfMiddleware implements NestMiddleware {
  private static readonly CSRF_COOKIE = 'csrf-token';
  private static readonly CSRF_HEADER = 'x-csrf-token';

  private readonly logger = new Logger(CsrfMiddleware.name);

  /** Paths exempt from CSRF header check. */
  private static readonly EXEMPT_PATH_PREFIXES = [
    '/health',
    '/ready',
    '/auth/google',
    // Unauthenticated auth flows — CSRF cookie not yet available on first visit.
    '/auth/login',
    '/auth/register',
    '/auth/verify-email',
    '/auth/resend-verification',
    '/auth/refresh',
    // Frontend runtime error telemetry endpoint (must remain best-effort).
    '/monitoring/frontend-errors',
  ];

  use(req: Request, res: Response, next: NextFunction): void {
    // Ensure the CSRF cookie is always present (used by frontend to read the token).
    let token = req.cookies?.[CsrfMiddleware.CSRF_COOKIE];
    if (!token) {
      token = crypto.randomBytes(32).toString('hex');
      res.cookie(CsrfMiddleware.CSRF_COOKIE, token, {
        httpOnly: false, // Must be readable by JavaScript so the frontend can attach it.
        sameSite: 'strict',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
      });
    }

    const method = req.method.toUpperCase();
    const isSafeMethod = ['GET', 'HEAD', 'OPTIONS'].includes(method);

    if (isSafeMethod) {
      return next();
    }

    // Root path does not expose mutating handlers in this app.
    // Some browsers/extensions/dev tooling may probe POST / without CSRF headers.
    if (req.path === '/') {
      return next();
    }

    // Bearer-token authenticated JSON APIs are not vulnerable to browser CSRF
    // in the same way as cookie-auth flows; skip CSRF validation for these
    // requests to avoid false 403s from non-browser/API clients.
    if (this.hasBearerAuthorization(req)) {
      return next();
    }

    // Check for exempt paths.
    const isExempt = CsrfMiddleware.EXEMPT_PATH_PREFIXES.some((prefix) =>
      req.path.startsWith(prefix),
    );
    if (isExempt) {
      return next();
    }

    // Validate the CSRF token from the header against the cookie.
    const headerToken = req.headers[CsrfMiddleware.CSRF_HEADER] as
      | string
      | undefined;

    if (!headerToken || !this.tokensMatch(token, headerToken)) {
      this.logger.warn(
        `CSRF validation failed — method=${method} path=${req.path} ip=${req.ip} referer=${req.headers.referer ?? 'n/a'} ua=${req.headers['user-agent'] ?? 'n/a'} hasAuth=${Boolean(req.headers.authorization)} hasCsrfHeader=${Boolean(headerToken)}`,
      );
      throw new ForbiddenException('Invalid or missing CSRF token.');
    }

    next();
  }

  private hasBearerAuthorization(req: Request): boolean {
    const authorization = req.headers.authorization;
    if (!authorization) return false;
    return /^bearer\s+.+$/i.test(authorization);
  }

  /**
   * Constant-time comparison to mitigate timing attacks.
   */
  private tokensMatch(a: string, b: string): boolean {
    if (a.length !== b.length) return false;
    try {
      return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
    } catch {
      return false;
    }
  }
}
