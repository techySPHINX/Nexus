import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { WinstonLoggerService } from '../logger/winston-logger.service';
import { Request, Response } from 'express';

/**
 * Interceptor for logging HTTP requests and responses
 */
@Injectable()
export class HttpLoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: WinstonLoggerService) { }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();
    const { method, url, ip, headers } = request;
    const userAgent = headers['user-agent'] || '';
    const userId = (request as any).user?.sub || 'anonymous';

    // Sanitize URL to remove sensitive query parameters
    const sanitizedUrl = this.sanitizeUrl(url);

    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const { statusCode } = response;
          const responseTime = Date.now() - startTime;

          // Log the request
          const logMessage = `${method} ${sanitizedUrl} ${statusCode} - ${responseTime}ms`;
          const metadata = {
            method,
            url: sanitizedUrl,
            statusCode,
            responseTime: `${responseTime}ms`,
            userId,
            ip,
            userAgent,
          };

          if (statusCode >= 400) {
            this.logger.warn(logMessage, 'HTTP');
          } else {
            this.logger.http(logMessage, metadata);
          }
        },
        error: (error) => {
          const responseTime = Date.now() - startTime;
          const statusCode = error.status || 500;

          const sanitizedErrorUrl = this.sanitizeUrl(url);
          this.logger.error(
            `${method} ${sanitizedErrorUrl} ${statusCode} - ${responseTime}ms - Error: ${error.message}`,
            error.stack,
            'HTTP',
          );
        },
      }),
    );
  }

  /**
   * Sanitize URL by removing sensitive query parameters and tokens
   */
  private sanitizeUrl(url: string): string {
    try {
      const urlObj = new URL(url, 'http://localhost');
      const sensitiveParams = ['token', 'password', 'secret', 'api_key', 'apikey', 'key', 'authorization', 'refresh_token', 'access_token'];

      sensitiveParams.forEach(param => {
        if (urlObj.searchParams.has(param)) {
          urlObj.searchParams.set(param, '[REDACTED]');
        }
      });

      return urlObj.pathname + urlObj.search;
    } catch {
      // If URL parsing fails, return original but sanitize common patterns
      return url.replace(/([?&])(token|password|secret|api_key|apikey|key|authorization|refresh_token|access_token)=([^&]*)/gi, '$1$2=[REDACTED]');
    }
  }
}
