import { Injectable } from '@nestjs/common';
import { RedisService } from './redis.service';
import { WinstonLoggerService } from '../logger/winston-logger.service';

export enum CacheTTL {
  SHORT = 300, // 5 minutes
  MEDIUM = 1800, // 30 minutes
  LONG = 3600, // 1 hour
  DAY = 86400, // 24 hours
}

@Injectable()
export class CachingService {
  constructor(
    private readonly redisService: RedisService,
    private readonly logger: WinstonLoggerService,
  ) { }

  /**
   * Cache key builder with namespace
   */
  private buildKey(namespace: string, key: string): string {
    return `cache:${namespace}:${key}`;
  }

  /**
   * Get cached data
   */
  async get<T>(namespace: string, key: string): Promise<T | null> {
    try {
      const cacheKey = this.buildKey(namespace, key);
      return await this.redisService.getCachedJSON<T>(cacheKey);
    } catch (error) {
      this.logger.error(
        `Cache get error for ${namespace}:${key}`,
        error.stack,
        'CachingService',
      );
      return null;
    }
  }

  /**
   * Set cached data
   */
  async set<T>(
    namespace: string,
    key: string,
    data: T,
    ttl: number = CacheTTL.MEDIUM,
  ): Promise<void> {
    try {
      const cacheKey = this.buildKey(namespace, key);
      await this.redisService.cacheJSON(cacheKey, data, ttl);
    } catch (error) {
      this.logger.error(
        `Cache set error for ${namespace}:${key}`,
        error.stack,
        'CachingService',
      );
    }
  }

  /**
   * Delete cached data
   */
  async del(namespace: string, key: string): Promise<void> {
    try {
      const cacheKey = this.buildKey(namespace, key);
      await this.redisService.del(cacheKey);
    } catch (error) {
      this.logger.error(
        `Cache delete error for ${namespace}:${key}`,
        error.stack,
        'CachingService',
      );
    }
  }

  /**
   * Invalidate all cache for a namespace
   */
  async invalidateNamespace(namespace: string): Promise<number> {
    try {
      const pattern = `cache:${namespace}:*`;
      return await this.redisService.invalidateCache(pattern);
    } catch (error) {
      this.logger.error(
        `Cache invalidation error for namespace ${namespace}`,
        error.stack,
        'CachingService',
      );
      return 0;
    }
  }

  /**
   * Get or compute - cache if miss
   */
  async getOrCompute<T>(
    namespace: string,
    key: string,
    computeFn: () => Promise<T>,
    ttl: number = CacheTTL.MEDIUM,
  ): Promise<T> {
    // Try to get from cache
    const cached = await this.get<T>(namespace, key);
    if (cached !== null) {
      return cached;
    }

    // Cache miss - compute value
    const value = await computeFn();

    // Store in cache
    await this.set(namespace, key, value, ttl);

    return value;
  }

  /**
   * Cache user profile
   */
  async cacheUserProfile(userId: string, profile: any): Promise<void> {
    await this.set('user:profile', userId, profile, CacheTTL.MEDIUM);
  }

  /**
   * Get cached user profile
   */
  async getUserProfile(userId: string): Promise<any | null> {
    return this.get('user:profile', userId);
  }

  /**
   * Invalidate user cache
   */
  async invalidateUserCache(userId: string): Promise<void> {
    await this.del('user:profile', userId);
    await this.invalidateNamespace(`user:${userId}`);
  }

  /**
   * Cache post with comments
   */
  async cachePost(postId: string, post: any): Promise<void> {
    await this.set('post', postId, post, CacheTTL.SHORT);
  }

  /**
   * Get cached post
   */
  async getPost(postId: string): Promise<any | null> {
    return this.get('post', postId);
  }

  /**
   * Invalidate post cache
   */
  async invalidatePost(postId: string): Promise<void> {
    await this.del('post', postId);
  }

  /**
   * Cache feed (paginated)
   */
  async cacheFeed(
    userId: string,
    page: number,
    feed: any[],
  ): Promise<void> {
    const key = `${userId}:page:${page}`;
    await this.set('feed', key, feed, CacheTTL.SHORT);
  }

  /**
   * Get cached feed
   */
  async getFeed(userId: string, page: number): Promise<any[] | null> {
    const key = `${userId}:page:${page}`;
    return this.get('feed', key);
  }

  /**
   * Invalidate user's feed cache
   */
  async invalidateUserFeed(userId: string): Promise<void> {
    await this.invalidateNamespace(`feed:cache:feed:${userId}`);
  }

  /**
   * Cache search results
   */
  async cacheSearchResults(
    query: string,
    filters: any,
    results: any[],
  ): Promise<void> {
    const key = `${query}:${JSON.stringify(filters)}`;
    await this.set('search', key, results, CacheTTL.MEDIUM);
  }

  /**
   * Get cached search results
   */
  async getSearchResults(
    query: string,
    filters: any,
  ): Promise<any[] | null> {
    const key = `${query}:${JSON.stringify(filters)}`;
    return this.get('search', key);
  }

  /**
   * Cache leaderboard
   */
  async cacheLeaderboard(
    type: string,
    leaderboard: any[],
  ): Promise<void> {
    await this.set('leaderboard', type, leaderboard, CacheTTL.LONG);
  }

  /**
   * Get cached leaderboard
   */
  async getLeaderboard(type: string): Promise<any[] | null> {
    return this.get('leaderboard', type);
  }

  /**
   * Invalidate leaderboard
   */
  async invalidateLeaderboard(): Promise<void> {
    await this.invalidateNamespace('leaderboard');
  }

  /**
   * Cache statistics
   */
  async cacheStats(key: string, stats: any): Promise<void> {
    await this.set('stats', key, stats, CacheTTL.LONG);
  }

  /**
   * Get cached stats
   */
  async getStats(key: string): Promise<any | null> {
    return this.get('stats', key);
  }

  /**
   * Cache notification count
   */
  async cacheNotificationCount(userId: string, count: number): Promise<void> {
    await this.set('notification:count', userId, count, CacheTTL.SHORT);
  }

  /**
   * Get cached notification count
   */
  async getNotificationCount(userId: string): Promise<number | null> {
    return this.get('notification:count', userId);
  }

  /**
   * Increment notification count
   */
  async incrementNotificationCount(userId: string): Promise<void> {
    const count = (await this.getNotificationCount(userId)) || 0;
    await this.cacheNotificationCount(userId, count + 1);
  }
}
