import { Injectable, LoggerService } from '@nestjs/common';
import * as winston from 'winston';
import * as path from 'path';

/**
 * Custom Winston Logger Service for comprehensive application logging
 */
@Injectable()
export class WinstonLoggerService implements LoggerService {
  private logger: winston.Logger;

  constructor() {
    const logDir = path.join(process.cwd(), 'logs');
    const env = process.env.NODE_ENV || 'development';
    const isProduction = env === 'production';

    // Define log format
    const logFormat = winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.errors({ stack: true }),
      winston.format.splat(),
      winston.format.json(),
    );

    // Console format for development
    const consoleFormat = winston.format.combine(
      winston.format.colorize(),
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.printf(({ timestamp, level, message, context, trace }) => {
        const contextStr = context ? `[${context}]` : '';
        const traceStr = trace ? `\n${trace}` : '';
        return `${timestamp} ${level} ${contextStr} ${message}${traceStr}`;
      }),
    );

    // Configure transports
    const transports: winston.transport[] = [
      // Console transport (always enabled)
      new winston.transports.Console({
        format: isProduction ? logFormat : consoleFormat,
        level: isProduction ? 'info' : 'debug',
      }),
    ];

    // File transports for production
    if (isProduction) {
      // Error log file
      transports.push(
        new winston.transports.File({
          filename: path.join(logDir, 'error.log'),
          level: 'error',
          format: logFormat,
          maxsize: 5242880, // 5MB
          maxFiles: 5,
        }),
      );

      // Combined log file
      transports.push(
        new winston.transports.File({
          filename: path.join(logDir, 'combined.log'),
          format: logFormat,
          maxsize: 5242880, // 5MB
          maxFiles: 5,
        }),
      );

      // Security events log
      transports.push(
        new winston.transports.File({
          filename: path.join(logDir, 'security.log'),
          level: 'warn',
          format: logFormat,
          maxsize: 5242880, // 5MB
          maxFiles: 10,
        }),
      );
    }

    this.logger = winston.createLogger({
      level: isProduction ? 'info' : 'debug',
      format: logFormat,
      transports,
      exitOnError: false,
    });
  }

  /**
   * Log informational messages
   */
  log(message: string, context?: string) {
    this.logger.info(message, { context });
  }

  /**
   * Log error messages
   */
  error(message: string, trace?: string, context?: string) {
    this.logger.error(message, { context, trace });
  }

  /**
   * Log warning messages
   */
  warn(message: string, context?: string) {
    this.logger.warn(message, { context });
  }

  /**
   * Log debug messages
   */
  debug(message: string, context?: string) {
    this.logger.debug(message, { context });
  }

  /**
   * Log verbose messages
   */
  verbose(message: string, context?: string) {
    this.logger.verbose(message, { context });
  }

  /**
   * Log security-related events
   */
  security(message: string, metadata?: any) {
    this.logger.warn(message, { context: 'SECURITY', ...metadata });
  }

  /**
   * Log audit trail events
   */
  audit(action: string, userId: string, metadata?: any) {
    this.logger.info('Audit Log', {
      context: 'AUDIT',
      action,
      userId,
      timestamp: new Date().toISOString(),
      ...metadata,
    });
  }

  /**
   * Log HTTP requests
   */
  http(message: string, metadata?: any) {
    this.logger.http(message, metadata);
  }

  /**
   * Get the underlying Winston logger instance
   */
  getLogger(): winston.Logger {
    return this.logger;
  }
}
