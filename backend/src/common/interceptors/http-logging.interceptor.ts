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

    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const { statusCode } = response;
          const responseTime = Date.now() - startTime;

          // Log the request
          const logMessage = `${method} ${url} ${statusCode} - ${responseTime}ms`;
          const metadata = {
            method,
            url,
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

          this.logger.error(
            `${method} ${url} ${statusCode} - ${responseTime}ms - Error: ${error.message}`,
            error.stack,
            'HTTP',
          );
        },
      }),
    );
  }
}
