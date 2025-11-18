import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CacheService } from '../services/cache.service';
import { Reflector } from '@nestjs/core';

/**
 * HTTP Caching Interceptor
 * Automatically caches GET request responses to reduce database load
 * Can be configured per endpoint using @CacheTTL() decorator
 */
@Injectable()
export class HttpCacheInterceptor implements NestInterceptor {
  private readonly logger = new Logger(HttpCacheInterceptor.name);

  constructor(
    private cacheService: CacheService,
    private reflector: Reflector,
  ) { }

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const { method, url, user } = request;

    // Only cache GET requests
    if (method !== 'GET') {
      return next.handle();
    }

    // Skip caching for admin endpoints or specific patterns
    if (url.includes('/admin/') || url.includes('/health')) {
      return next.handle();
    }

    // Get TTL from decorator or use default
    const ttl = this.reflector.get<number>('cache_ttl', context.getHandler()) || 300;

    // Generate cache key based on URL and user (for personalized content)
    const userId = user?.id || 'anonymous';
    const cacheKey = `http:${userId}:${url}`;

    try {
      // Try to get from cache
      const cachedResponse = await this.cacheService.get(cacheKey);

      if (cachedResponse) {
        this.logger.debug(`✅ Cache hit for ${url}`);
        return of(cachedResponse);
      }

      // Not in cache, execute request and cache response
      return next.handle().pipe(
        tap(async (response) => {
          if (response) {
            await this.cacheService.set(cacheKey, response, ttl);
            this.logger.debug(`📦 Cached response for ${url} (TTL: ${ttl}s)`);
          }
        }),
      );
    } catch (error) {
      this.logger.error(`Cache error for ${url}:`, error.message);
      // On cache error, proceed without caching
      return next.handle();
    }
  }
}
