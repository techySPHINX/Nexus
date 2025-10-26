import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { getCorsConfig, securityConfig } from './common/config/security.config';
import { WinstonLoggerService } from './common/logger/winston-logger.service';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { HttpLoggingInterceptor } from './common/interceptors/http-logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });

  // Get Winston logger from the DI container
  const loggerService = app.get(WinstonLoggerService);
  app.useLogger(loggerService);

  // Log application startup
  loggerService.log(
    '🚀 Initializing Nexus Backend Application...',
    'Bootstrap',
  );

  // Configure WebSocket adapter
  app.useWebSocketAdapter(new IoAdapter(app));
  loggerService.log('✅ WebSocket adapter configured', 'Bootstrap');

  app.enableCors({
    origin: ['http://localhost:3001', 'http://localhost:4173'],
    credentials: true,
  });

  // CORS - Configure Cross-Origin Resource Sharing
  app.enableCors(getCorsConfig());
  loggerService.log('✅ CORS configured', 'Bootstrap');

  // Global Validation Pipe with sanitization
  app.useGlobalPipes(new ValidationPipe(securityConfig.validation));
  loggerService.log(
    '✅ Global validation pipe with sanitization enabled',
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
