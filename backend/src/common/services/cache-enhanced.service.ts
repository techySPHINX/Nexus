import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

interface CacheOptions {
  ttl?: number; // Time to live in seconds
  prefix?: string;
}

/**
 * Enhanced caching service with Redis support
 * Implements distributed caching for high-performance scenarios
 */
@Injectable()
export class CacheEnhancedService implements OnModuleInit {
  private readonly logger = new Logger(CacheEnhancedService.name);
  private redis: Redis;
  private localCache: Map<string, { value: any; expires: number }> = new Map();
  private readonly DEFAULT_TTL = 300; // 5 minutes
  private readonly LOCAL_CACHE_MAX_SIZE = 1000;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    try {
      // Initialize Redis connection
      const redisUrl = this.configService.get<string>('REDIS_URL');
      if (redisUrl) {
        this.redis = new Redis(redisUrl, {
          maxRetriesPerRequest: 3,
          retryStrategy: (times) => {
            const delay = Math.min(times * 50, 2000);
            return delay;
          },
        });

        this.redis.on('error', (err) => {
          this.logger.error('Redis connection error:', err);
        });

        this.redis.on('connect', () => {
          this.logger.log('Redis connected successfully');
        });
      } else {
        this.logger.warn('Redis URL not configured, using local cache only');
      }
    } catch (error) {
      this.logger.error('Failed to initialize Redis:', error);
    }

    // Start cache cleanup interval
    setInterval(() => this.cleanupLocalCache(), 60000); // Every minute
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string, options?: CacheOptions): Promise<T | null> {
    const fullKey = this.buildKey(key, options?.prefix);

    // Try local cache first (faster)
    const localValue = this.getFromLocalCache(fullKey);
    if (localValue !== null) {
      return localValue as T;
    }

    // Try Redis
    if (this.redis) {
      try {
        const value = await this.redis.get(fullKey);
        if (value) {
          const parsed = JSON.parse(value);
          // Store in local cache for faster subsequent access
          this.setInLocalCache(
            fullKey,
            parsed,
            options?.ttl || this.DEFAULT_TTL,
          );
          return parsed as T;
        }
      } catch (error) {
        this.logger.error(`Failed to get from Redis: ${error.message}`);
      }
    }

    return null;
  }

  /**
   * Set value in cache
   */
  async set(key: string, value: any, options?: CacheOptions): Promise<void> {
    const fullKey = this.buildKey(key, options?.prefix);
    const ttl = options?.ttl || this.DEFAULT_TTL;

    // Set in local cache
    this.setInLocalCache(fullKey, value, ttl);

    // Set in Redis
    if (this.redis) {
      try {
        await this.redis.setex(fullKey, ttl, JSON.stringify(value));
      } catch (error) {
        this.logger.error(`Failed to set in Redis: ${error.message}`);
      }
    }
  }

  /**
   * Delete value from cache
   */
  async delete(key: string, options?: CacheOptions): Promise<void> {
    const fullKey = this.buildKey(key, options?.prefix);

    // Delete from local cache
    this.localCache.delete(fullKey);

    // Delete from Redis
    if (this.redis) {
      try {
        await this.redis.del(fullKey);
      } catch (error) {
        this.logger.error(`Failed to delete from Redis: ${error.message}`);
      }
    }
  }

  /**
   * Clear all cache
   */
  async clear(prefix?: string): Promise<void> {
    if (prefix) {
      // Clear by prefix
      const pattern = `${prefix}:*`;

      // Clear local cache
      for (const key of this.localCache.keys()) {
        if (key.startsWith(prefix)) {
          this.localCache.delete(key);
        }
      }

      // Clear Redis
      if (this.redis) {
        try {
          const keys = await this.redis.keys(pattern);
          if (keys.length > 0) {
            await this.redis.del(...keys);
          }
        } catch (error) {
          this.logger.error(
            `Failed to clear Redis by prefix: ${error.message}`,
          );
        }
      }
    } else {
      // Clear all
      this.localCache.clear();
      if (this.redis) {
        try {
          await this.redis.flushdb();
        } catch (error) {
          this.logger.error(`Failed to clear Redis: ${error.message}`);
        }
      }
    }
  }

  /**
   * Get or set pattern (cache-aside)
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    options?: CacheOptions,
  ): Promise<T> {
    // Try to get from cache
    const cached = await this.get<T>(key, options);
    if (cached !== null) {
      return cached;
    }

    // Not in cache, fetch from factory
    const value = await factory();

    // Store in cache
    await this.set(key, value, options);

    return value;
  }

  /**
   * Build full cache key with prefix
   */
  private buildKey(key: string, prefix?: string): string {
    return prefix ? `${prefix}:${key}` : key;
  }

  /**
   * Get from local cache
   */
  private getFromLocalCache(key: string): any | null {
    const entry = this.localCache.get(key);
    if (!entry) {
      return null;
    }

    if (Date.now() > entry.expires) {
      this.localCache.delete(key);
      return null;
    }

    return entry.value;
  }

  /**
   * Set in local cache
   */
  private setInLocalCache(key: string, value: any, ttl: number): void {
    // Enforce max size
    if (this.localCache.size >= this.LOCAL_CACHE_MAX_SIZE) {
      // Remove oldest entry
      const firstKey = this.localCache.keys().next().value;
      this.localCache.delete(firstKey);
    }

    this.localCache.set(key, {
      value,
      expires: Date.now() + ttl * 1000,
    });
  }

  /**
   * Cleanup expired entries from local cache
   */
  private cleanupLocalCache(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.localCache.entries()) {
      if (now > entry.expires) {
        this.localCache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      this.logger.debug(`Cleaned up ${cleaned} expired cache entries`);
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    localCacheSize: number;
    redisConnected: boolean;
  } {
    return {
      localCacheSize: this.localCache.size,
      redisConnected: this.redis?.status === 'ready',
    };
  }
}
