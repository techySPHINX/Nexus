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
import { SanitizePipe } from './common/pipes/sanitize.pipe';
import helmet from 'helmet';
import * as compression from 'compression';
import * as cookieParser from 'cookie-parser';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
    bodyParser: true,
  });

  // Get Winston logger from the DI container
  const loggerService = app.get(WinstonLoggerService);
  app.useLogger(loggerService);

  loggerService.log(
    '🚀 Initializing Nexus Backend Application...',
    'Bootstrap',
  );

  // ============================================
  // Cookie Parser — must be registered before CSRF middleware so
  // req.cookies is populated when CsrfMiddleware runs (Issue #162).
  // ============================================
  app.use(cookieParser());

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

  // ============================================
  // SECURITY: CORS - Cross-Origin Resource Sharing
  // Single authoritative CORS configuration derived from environment.
  // Dev default: http://localhost:3001 (HTTP, not HTTPS).
  // Production: set FRONTEND_URL env var to the deployed frontend origin.
  // ============================================
  const corsConfig = getCorsConfig();
  app.enableCors(corsConfig);
  loggerService.log(
    `✅ CORS configured for origins: ${JSON.stringify(corsConfig.origin)}`,
    'Bootstrap',
  );

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
  // Connect to Redis for Socket.IO adapter but don't block application startup.
  // If Redis is slow or unavailable, connecting can hang; run connect in background.
  redisIoAdapter.connectToRedis().catch((err) => {
    const fallbackLogger = new WinstonLoggerService();
    fallbackLogger.error(
      'Redis adapter background connection failed',
      err?.stack || String(err),
      'Bootstrap',
    );
  });
  app.useWebSocketAdapter(redisIoAdapter);
  loggerService.log(
    '✅ WebSocket adapter configured with Redis (multi-server support)',
    'Bootstrap',
  );

  // ============================================
  // VALIDATION: Global Validation Pipe with Auto-Transformation
  // ============================================
  // Sanitize first so ValidationPipe runs on clean data (Copilot recommendation).
  // SanitizePipe strips HTML tags and XSS vectors before DTO validation,
  // preventing values from passing validation only to become invalid post-sanitization.
  app.useGlobalPipes(
    new SanitizePipe(),
    new ValidationPipe(securityConfig.validation),
  );
  loggerService.log(
    '✅ Global sanitization + validation pipes registered (sanitize → validate order)',
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

  // ============================================
  // SWAGGER / OPENAPI — disabled in production
  // Accessible at: GET /api/docs
  // ============================================
  if (process.env.NODE_ENV !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Nexus API')
      .setDescription(
        'Nexus — Student & Alumni Networking Platform REST API. ' +
          'All protected endpoints require a Bearer JWT token.',
      )
      .setVersion('1.0')
      .addBearerAuth(
        { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        'JWT',
      )
      .addTag('auth', 'Authentication & authorisation')
      .addTag('users', 'User management')
      .addTag('profile', 'User profiles')
      .addTag('connections', 'Peer connections')
      .addTag('messaging', 'Real-time chat & messaging')
      .addTag('posts', 'Posts & engagement')
      .addTag('referrals', 'Job referrals')
      .addTag('mentorship', 'Mentorship programme')
      .addTag('events', 'Events & calendar')
      .addTag('showcase', 'Project showcase')
      .addTag('news', 'News feed')
      .addTag('notifications', 'Push notifications')
      .addTag('gamification', 'Badges & achievements')
      .addTag('admin', 'Admin panel')
      .addTag('health', 'Health & readiness probes')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        tagsSorter: 'alpha',
        operationsSorter: 'alpha',
      },
    });
    loggerService.log('✅ Swagger UI available at /api/docs', 'Bootstrap');
  }

  const port = process.env.PORT || 3000;
  await app.listen(port);

  const env = process.env.NODE_ENV || 'development';
  loggerService.log(
    `🚀 Application is running on: http://localhost:${port}`,
    'Bootstrap',
  );
  loggerService.log(`📦 Environment: ${env}`, 'Bootstrap');
  loggerService.log(
    `🔒 Security: Helmet, CORS, Rate Limiting, Validation, Exception Handling, Audit Logging`,
    'Bootstrap',
  );
}
bootstrap();
