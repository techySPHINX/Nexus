import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CacheService } from './services/cache.service';
import { RedisService } from './services/redis.service';
import { FcmService } from './services/fcm.service';

/**
 * Global module for common services used across the application
 * Includes caching, Redis, FCM, and other shared utilities
 */
@Global()
@Module({
  imports: [ConfigModule],
  providers: [CacheService, RedisService, FcmService],
  exports: [CacheService, RedisService, FcmService],
})
export class CommonModule { }
