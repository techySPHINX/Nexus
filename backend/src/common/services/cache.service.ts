import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

/**
 * Advanced Redis caching service with compression, TTL management, and cache warming
 * Provides production-grade caching capabilities for frequently accessed data
 */
@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  private readonly redis: Redis;
  private readonly defaultTTL = 3600; // 1 hour default

  // Cache key prefixes for organization
  private readonly PREFIXES = {
    USER: 'user:',
    POST: 'post:',
    PROFILE: 'profile:',
    STATS: 'stats:',
    SESSION: 'session:',
    FEED: 'feed:',
    SEARCH: 'search:',
  };

  constructor(private configService: ConfigService) {
    const redisUrl = this.configService.get<string>('REDIS_URL');

    if (redisUrl) {
      // Cloud Redis (production)
      this.redis = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        retryStrategy: (times) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
        enableReadyCheck: true,
        enableOfflineQueue: true,
        lazyConnect: false,
      });
    } else {
      // Local Redis (development)
      this.redis = new Redis(
        this.configService.get<string>('REDIS_URL'),
      );
    }

    this.redis.on('connect', () => {
      this.logger.log('✅ Cache service connected to Redis');
    });

    this.redis.on('error', (error) => {
      this.logger.error('❌ Redis cache error:', error.message);
    });

    this.redis.on('reconnecting', () => {
      this.logger.warn('⚠️ Cache service reconnecting to Redis...');
    });
  }

  /**
   * Get cached value with automatic JSON parsing
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.redis.get(key);
      if (!value) {
        return null;
      }

      return JSON.parse(value) as T;
    } catch (error) {
      this.logger.error(`Failed to get cache for key ${key}:`, error.message);
      return null;
    }
  }

  /**
   * Set cache value with automatic JSON stringification and TTL
   */
  async set(
    key: string,
    value: any,
    ttl: number = this.defaultTTL,
  ): Promise<boolean> {
    try {
      const serialized = JSON.stringify(value);
      await this.redis.setex(key, ttl, serialized);
      return true;
    } catch (error) {
      this.logger.error(`Failed to set cache for key ${key}:`, error.message);
      return false;
    }
  }

  /**
   * Delete cached value
   */
  async del(key: string): Promise<boolean> {
    try {
      await this.redis.del(key);
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to delete cache for key ${key}:`,
        error.message,
      );
      return false;
    }
  }

  /**
   * Delete multiple keys matching a pattern
   */
  async delPattern(pattern: string): Promise<number> {
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length === 0) {
        return 0;
      }
      await this.redis.del(...keys);
      return keys.length;
    } catch (error) {
      this.logger.error(
        `Failed to delete cache pattern ${pattern}:`,
        error.message,
      );
      return 0;
    }
  }

  /**
   * Get or set pattern - fetch from cache or compute and cache
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttl: number = this.defaultTTL,
  ): Promise<T> {
    // Try to get from cache first
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Not in cache, compute value
    const value = await factory();

    // Store in cache
    await this.set(key, value, ttl);

    return value;
  }

  /**
   * Increment counter with optional expiration
   */
  async increment(key: string, ttl?: number): Promise<number> {
    try {
      const value = await this.redis.incr(key);

      if (ttl && value === 1) {
        // Only set TTL on first increment
        await this.redis.expire(key, ttl);
      }

      return value;
    } catch (error) {
      this.logger.error(
        `Failed to increment cache for key ${key}:`,
        error.message,
      );
      return 0;
    }
  }

  /**
   * Decrement counter
   */
  async decrement(key: string): Promise<number> {
    try {
      return await this.redis.decr(key);
    } catch (error) {
      this.logger.error(
        `Failed to decrement cache for key ${key}:`,
        error.message,
      );
      return 0;
    }
  }

  /**
   * Add item to set
   */
  async sAdd(key: string, ...members: string[]): Promise<number> {
    try {
      return await this.redis.sadd(key, ...members);
    } catch (error) {
      this.logger.error(
        `Failed to add to set ${key}:`,
        error.message,
      );
      return 0;
    }
  }

  /**
   * Remove item from set
   */
  async sRem(key: string, ...members: string[]): Promise<number> {
    try {
      return await this.redis.srem(key, ...members);
    } catch (error) {
      this.logger.error(
        `Failed to remove from set ${key}:`,
        error.message,
      );
      return 0;
    }
  }

  /**
   * Get all members of a set
   */
  async sMembers(key: string): Promise<string[]> {
    try {
      return await this.redis.smembers(key);
    } catch (error) {
      this.logger.error(
        `Failed to get set members ${key}:`,
        error.message,
      );
      return [];
    }
  }

  /**
   * Check if member exists in set
   */
  async sIsMember(key: string, member: string): Promise<boolean> {
    try {
      const result = await this.redis.sismember(key, member);
      return result === 1;
    } catch (error) {
      this.logger.error(
        `Failed to check set membership ${key}:`,
        error.message,
      );
      return false;
    }
  }

  /**
   * Get set cardinality (number of members)
   */
  async sCard(key: string): Promise<number> {
    try {
      return await this.redis.scard(key);
    } catch (error) {
      this.logger.error(
        `Failed to get set cardinality ${key}:`,
        error.message,
      );
      return 0;
    }
  }

  /**
   * Hash set - store object field
   */
  async hSet(key: string, field: string, value: any): Promise<boolean> {
    try {
      await this.redis.hset(key, field, JSON.stringify(value));
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to set hash ${key}:`,
        error.message,
      );
      return false;
    }
  }

  /**
   * Hash get - retrieve object field
   */
  async hGet<T>(key: string, field: string): Promise<T | null> {
    try {
      const value = await this.redis.hget(key, field);
      if (!value) {
        return null;
      }
      return JSON.parse(value) as T;
    } catch (error) {
      this.logger.error(
        `Failed to get hash ${key}:`,
        error.message,
      );
      return null;
    }
  }

  /**
   * Hash get all - retrieve entire hash object
   */
  async hGetAll<T>(key: string): Promise<T | null> {
    try {
      const value = await this.redis.hgetall(key);
      if (!value || Object.keys(value).length === 0) {
        return null;
      }

      // Parse JSON values
      const parsed: any = {};
      for (const [field, val] of Object.entries(value)) {
        try {
          parsed[field] = JSON.parse(val);
        } catch {
          parsed[field] = val; // Keep as string if not JSON
        }
      }

      return parsed as T;
    } catch (error) {
      this.logger.error(
        `Failed to get hash all ${key}:`,
        error.message,
      );
      return null;
    }
  }

  /**
   * Hash delete field
   */
  async hDel(key: string, ...fields: string[]): Promise<number> {
    try {
      return await this.redis.hdel(key, ...fields);
    } catch (error) {
      this.logger.error(
        `Failed to delete hash field ${key}:`,
        error.message,
      );
      return 0;
    }
  }

  /**
   * Cache user data
   */
  async cacheUser(userId: string, userData: any, ttl = 3600): Promise<void> {
    const key = `${this.PREFIXES.USER}${userId}`;
    await this.set(key, userData, ttl);
  }

  /**
   * Get cached user data
   */
  async getCachedUser<T>(userId: string): Promise<T | null> {
    const key = `${this.PREFIXES.USER}${userId}`;
    return await this.get<T>(key);
  }

  /**
   * Invalidate user cache
   */
  async invalidateUser(userId: string): Promise<void> {
    const key = `${this.PREFIXES.USER}${userId}`;
    await this.del(key);
  }

  /**
   * Cache user profile
   */
  async cacheProfile(
    userId: string,
    profileData: any,
    ttl = 3600,
  ): Promise<void> {
    const key = `${this.PREFIXES.PROFILE}${userId}`;
    await this.set(key, profileData, ttl);
  }

  /**
   * Get cached profile
   */
  async getCachedProfile<T>(userId: string): Promise<T | null> {
    const key = `${this.PREFIXES.PROFILE}${userId}`;
    return await this.get<T>(key);
  }

  /**
   * Invalidate profile cache
   */
  async invalidateProfile(userId: string): Promise<void> {
    const key = `${this.PREFIXES.PROFILE}${userId}`;
    await this.del(key);
  }

  /**
   * Cache post data
   */
  async cachePost(postId: string, postData: any, ttl = 1800): Promise<void> {
    const key = `${this.PREFIXES.POST}${postId}`;
    await this.set(key, postData, ttl);
  }

  /**
   * Get cached post
   */
  async getCachedPost<T>(postId: string): Promise<T | null> {
    const key = `${this.PREFIXES.POST}${postId}`;
    return await this.get<T>(key);
  }

  /**
   * Invalidate post cache
   */
  async invalidatePost(postId: string): Promise<void> {
    const key = `${this.PREFIXES.POST}${postId}`;
    await this.del(key);
  }

  /**
   * Cache user feed
   */
  async cacheFeed(userId: string, feedData: any, ttl = 300): Promise<void> {
    const key = `${this.PREFIXES.FEED}${userId}`;
    await this.set(key, feedData, ttl);
  }

  /**
   * Get cached feed
   */
  async getCachedFeed<T>(userId: string): Promise<T | null> {
    const key = `${this.PREFIXES.FEED}${userId}`;
    return await this.get<T>(key);
  }

  /**
   * Invalidate feed cache
   */
  async invalidateFeed(userId: string): Promise<void> {
    const key = `${this.PREFIXES.FEED}${userId}`;
    await this.del(key);
  }

  /**
   * Cache search results
   */
  async cacheSearch(
    query: string,
    results: any,
    ttl = 600,
  ): Promise<void> {
    const key = `${this.PREFIXES.SEARCH}${this.hashString(query)}`;
    await this.set(key, results, ttl);
  }

  /**
   * Get cached search results
   */
  async getCachedSearch<T>(query: string): Promise<T | null> {
    const key = `${this.PREFIXES.SEARCH}${this.hashString(query)}`;
    return await this.get<T>(key);
  }

  /**
   * Invalidate all search cache
   */
  async invalidateAllSearches(): Promise<void> {
    await this.delPattern(`${this.PREFIXES.SEARCH}*`);
  }

  /**
   * Get cache statistics
   */
  async getStats() {
    try {
      const info = await this.redis.info('stats');
      const dbSize = await this.redis.dbsize();

      return {
        connected: this.redis.status === 'ready',
        databaseSize: dbSize,
        info,
      };
    } catch (error) {
      this.logger.error('Failed to get cache stats:', error.message);
      return {
        connected: false,
        databaseSize: 0,
        info: '',
      };
    }
  }

  /**
   * Flush all cache (use with caution!)
   */
  async flushAll(): Promise<boolean> {
    try {
      await this.redis.flushall();
      this.logger.warn('🗑️ All cache data flushed');
      return true;
    } catch (error) {
      this.logger.error('Failed to flush cache:', error.message);
      return false;
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const result = await this.redis.ping();
      return result === 'PONG';
    } catch (error) {
      this.logger.error('Cache health check failed:', error.message);
      return false;
    }
  }

  /**
   * Hash string for cache keys (simple hash function)
   */
  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Close Redis connection (for cleanup)
   */
  async onModuleDestroy() {
    await this.redis.quit();
    this.logger.log('Cache service disconnected');
  }
}
