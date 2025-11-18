import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { RedisIoAdapter } from './common/adapters/redis-io.adapter';
import { getCorsConfig, securityConfig } from './common/config/security.config';
import { WinstonLoggerService } from './common/logger/winston-logger.service';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { HttpLoggingInterceptor } from './common/interceptors/http-logging.interceptor';
import helmet from 'helmet';
import * as compression from 'compression';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
    bodyParser: true,
  });

  // Get Winston logger from the DI container
  const loggerService = app.get(WinstonLoggerService);
  app.useLogger(loggerService);

  // Log application startup
  loggerService.log(
    '🚀 Initializing Nexus Backend Application...',
    'Bootstrap',
  );

  // ============================================
  // SECURITY: Helmet - Security Headers
  // ============================================
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:'],
        },
      },
      crossOriginEmbedderPolicy: false, // Allow embedding for WebSocket
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      hsts: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true,
      },
    }),
  );
  loggerService.log('✅ Helmet security headers enabled', 'Bootstrap');

  app.enableCors({
    origin: process.env.ALLOWED_ORIGIN || "https://localhost:3001",
    credentials: true,
  });

  console.log('Cors allowed origin:', process.env.ALLOWED_ORIGIN || "https://localhost:3001");
  loggerService.log('✅ CORS configured', 'Bootstrap');

  // CORS - Configure Cross-Origin Resource Sharing
  app.enableCors(getCorsConfig());
  loggerService.log('✅ CORS configured', 'Bootstrap');

  // Global Validation Pipe with sanitization
  app.useGlobalPipes(new ValidationPipe(securityConfig.validation));
  // ============================================
  // PERFORMANCE: Compression (gzip/brotli)
  // ============================================
  app.use(
    compression({
      filter: (req, res) => {
        // Don't compress responses for WebSocket upgrade requests
        if (req.headers['upgrade']) {
          return false;
        }
        // Use compression for everything else
        return compression.filter(req, res);
      },
      level: 6, // Balanced compression level (0-9)
      threshold: 1024, // Only compress responses > 1KB
      memLevel: 8, // Memory level for compression (1-9)
    }),
  );
  loggerService.log(
    '✅ Response compression enabled (gzip/brotli)',
    'Bootstrap',
  );

  // ============================================
  // WEBSOCKET: Redis Adapter for Horizontal Scalability
  // ============================================
  const redisIoAdapter = new RedisIoAdapter(app);
  await redisIoAdapter.connectToRedis();
  app.useWebSocketAdapter(redisIoAdapter);
  loggerService.log(
    '✅ WebSocket adapter configured with Redis (multi-server support)',
    'Bootstrap',
  );

  // ============================================
  // SECURITY: CORS - Cross-Origin Resource Sharing
  // ============================================
  const corsConfig = getCorsConfig();
  app.enableCors(corsConfig);
  loggerService.log(
    `✅ CORS configured for origins: ${corsConfig.origin}`,
    'Bootstrap',
  );

  // ============================================
  // VALIDATION: Global Validation Pipe with Auto-Transformation
  // ============================================
  app.useGlobalPipes(
    new ValidationPipe({
      ...securityConfig.validation,
      transform: true, // Enable auto-transformation of payloads
      transformOptions: {
        enableImplicitConversion: true, // Auto-convert string to number, etc.
      },
    }),
  );
  loggerService.log(
    '✅ Global validation pipe with auto-transformation enabled',
    'Bootstrap',
  );

  // Error Handling: Global Exception Filter
  app.useGlobalFilters(new GlobalExceptionFilter(loggerService));
  loggerService.log('✅ Global exception filter registered', 'Bootstrap');

  // Logging: HTTP Request/Response Interceptor
  app.useGlobalInterceptors(new HttpLoggingInterceptor(loggerService));
  loggerService.log('✅ HTTP logging interceptor registered', 'Bootstrap');

  // Serve static assets
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });
  loggerService.log('✅ Static assets configured', 'Bootstrap');

  // Trust proxy (important for production behind load balancers)
  app.set('trust proxy', 1);
  loggerService.log('✅ Proxy trust configured', 'Bootstrap');

  const port = process.env.PORT || 3000;
  await app.listen(port);

  const env = process.env.NODE_ENV || 'development';
  loggerService.log(
    `🚀 Application is running on: http://localhost:${port}`,
    'Bootstrap',
  );
  loggerService.log(`📦 Environment: ${env}`, 'Bootstrap');
  loggerService.log(
    `🔒 Security features enabled: Helmet, CORS, Rate Limiting, Input Validation, Global Exception Handling, Audit Logging`,
    'Bootstrap',
  );
}
bootstrap();
