import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PerformanceMonitoringService } from '../services/performance-monitoring.service';

/**
 * Interceptor to track performance of all HTTP requests
 */
@Injectable()
export class PerformanceInterceptor implements NestInterceptor {
  private readonly logger = new Logger(PerformanceInterceptor.name);

  constructor(
    private readonly performanceService: PerformanceMonitoringService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url } = request;
    const operationName = `${method} ${url}`;

    const operationId = this.performanceService.startOperation(operationName);

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = this.performanceService.endOperation(operationId, {
            method,
            url,
            statusCode: 200,
          });

          // Log slow requests (> 500ms)
          if (duration > 500) {
            this.logger.warn(
              `Slow request: ${method} ${url} took ${duration.toFixed(2)}ms`,
            );
          }
        },
        error: (error) => {
          const duration = this.performanceService.endOperation(operationId, {
            method,
            url,
            statusCode: error.status || 500,
            error: error.message,
          });

          this.logger.error(
            `Request error: ${method} ${url} failed after ${duration.toFixed(2)}ms`,
            error.stack,
          );
        },
      }),
    );
  }
}
