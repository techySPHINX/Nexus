import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { WinstonLoggerService } from '../logger/winston-logger.service';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { ThrottlerException } from '@nestjs/throttler';

interface ErrorResponse {
  statusCode: number;
  timestamp: string;
  path: string;
  method: string;
  message: string;
  error?: string;
  details?: any;
  requestId?: string;
}

/**
 * Global exception filter for centralized error handling
 */
@Catch()
@Injectable()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: WinstonLoggerService) { }

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const errorResponse = this.buildErrorResponse(exception, request);

    // Log the error
    this.logError(exception, request, errorResponse);

    // Send response
    response.status(errorResponse.statusCode).json(errorResponse);
  }

  private buildErrorResponse(
    exception: unknown,
    request: Request,
  ): ErrorResponse {
    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let error = 'InternalServerError';
    let details: any = undefined;

    // Handle HTTP exceptions
    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        message =
          (exceptionResponse as any).message || exception.message || message;
        error = (exceptionResponse as any).error || exception.name;
        details = (exceptionResponse as any).details;
      }
    }
    // Handle Prisma errors
    else if (exception instanceof PrismaClientKnownRequestError) {
      const prismaError = this.handlePrismaError(exception);
      statusCode = prismaError.statusCode;
      message = prismaError.message;
      error = prismaError.error;
    }
    // Handle Throttler exceptions
    else if (exception instanceof ThrottlerException) {
      statusCode = HttpStatus.TOO_MANY_REQUESTS;
      message = 'Too many requests, please slow down';
      error = 'ThrottlerException';
    }
    // Handle unknown errors
    else if (exception instanceof Error) {
      message =
        process.env.NODE_ENV === 'production'
          ? 'An unexpected error occurred'
          : exception.message;
      error = exception.name;
    }

    const errorResponse: ErrorResponse = {
      statusCode,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message,
      error,
      requestId: this.generateRequestId(),
    };

    // Add details only in development
    if (process.env.NODE_ENV !== 'production' && details) {
      errorResponse.details = details;
    }

    return errorResponse;
  }

  private handlePrismaError(error: PrismaClientKnownRequestError): {
    statusCode: number;
    message: string;
    error: string;
  } {
    switch (error.code) {
      case 'P2002':
        // Unique constraint violation
        const field = (error.meta?.target as string[])?.[0] || 'field';
        return {
          statusCode: HttpStatus.CONFLICT,
          message: `A record with this ${field} already exists`,
          error: 'UniqueConstraintViolation',
        };

      case 'P2025':
        // Record not found
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Record not found',
          error: 'RecordNotFound',
        };

      case 'P2003':
        // Foreign key constraint violation
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Related record not found',
          error: 'ForeignKeyConstraintViolation',
        };

      case 'P2014':
        // Relation violation
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Invalid relation in the request',
          error: 'RelationViolation',
        };

      default:
        return {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message:
            process.env.NODE_ENV === 'production'
              ? 'Database error occurred'
              : error.message,
          error: 'DatabaseError',
        };
    }
  }

  private logError(
    exception: unknown,
    request: Request,
    errorResponse: ErrorResponse,
  ) {
    const { statusCode, message, error, path, method } = errorResponse;
    const userId = (request as any).user?.sub || 'anonymous';
    const ipAddress = request.ip || request.headers['x-forwarded-for'];

    const logMessage = `${method} ${path} - ${statusCode} ${error}: ${message}`;
    const metadata = {
      statusCode,
      error,
      path,
      method,
      userId,
      ipAddress,
      userAgent: request.headers['user-agent'],
      requestId: errorResponse.requestId,
    };

    // Log based on severity
    if (statusCode >= 500) {
      // Server errors - log with stack trace
      const stack =
        exception instanceof Error ? exception.stack : 'No stack trace';
      this.logger.error(logMessage, stack, 'ExceptionFilter');

      // Log to security log if it's a security-related error
      if (this.isSecurityRelated(exception)) {
        this.logger.security('Security exception occurred', metadata);
      }
    } else if (statusCode >= 400) {
      // Client errors - log as warning
      this.logger.warn(logMessage, 'ExceptionFilter');

      // Log authentication/authorization failures
      if (statusCode === 401 || statusCode === 403) {
        this.logger.security('Authentication/Authorization failure', metadata);
      }
    } else {
      // Other cases
      this.logger.log(logMessage, 'ExceptionFilter');
    }
  }

  private isSecurityRelated(exception: unknown): boolean {
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      return (
        status === HttpStatus.UNAUTHORIZED ||
        status === HttpStatus.FORBIDDEN ||
        status === HttpStatus.TOO_MANY_REQUESTS
      );
    }
    return false;
  }

  private generateRequestId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
