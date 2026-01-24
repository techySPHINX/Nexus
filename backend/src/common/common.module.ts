import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { CacheService } from './services/cache.service';
import { RedisService } from './services/redis.service';
import { FcmService } from './services/fcm.service';
import { PresenceService } from './services/presence.service';
import { WebSocketMonitoringService } from './services/websocket-monitoring.service';
import { PushNotificationService } from './services/push-notification.service';
import { UnifiedWebSocketGateway } from './gateways/unified-websocket.gateway';
import { NotificationGateway } from './gateways/notification.gateway';
import { DashboardGateway } from './gateways/dashboard.gateway';
import { PrismaModule } from '../prisma/prisma.module';
import { WinstonLoggerService } from './logger/winston-logger.service';

/**
 * Global module for common services used across the application
 * Includes caching, Redis, FCM, WebSocket infrastructure, and other shared utilities
 */
@Global()
@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '7d' },
    }),
  ],
  providers: [
    WinstonLoggerService,
    CacheService,
    RedisService,
    FcmService,
    PresenceService,
    WebSocketMonitoringService,
    PushNotificationService,
    UnifiedWebSocketGateway,
    NotificationGateway,
    DashboardGateway,
  ],
  exports: [
    WinstonLoggerService,
    CacheService,
    RedisService,
    FcmService,
    PresenceService,
    WebSocketMonitoringService,
    PushNotificationService,
    UnifiedWebSocketGateway,
    NotificationGateway,
    DashboardGateway,
  ],
})
export class CommonModule { }
