import { SetMetadata } from '@nestjs/common';

/**
 * Decorator to set cache TTL (Time To Live) in seconds for a route handler
 * 
 * @param ttl - Time to live in seconds
 * 
 * @example
 * ```typescript
 * @Get('users')
 * @CacheTTL(600) // Cache for 10 minutes
 * async getUsers() {
 *   return this.userService.findAll();
 * }
 * ```
 */
export const CacheTTL = (ttl: number) => SetMetadata('cache_ttl', ttl);

/**
 * Decorator to skip caching for a specific route
 * 
 * @example
 * ```typescript
 * @Get('sensitive-data')
 * @SkipCache()
 * async getSensitiveData() {
 *   return this.service.getData();
 * }
 * ```
 */
export const SkipCache = () => SetMetadata('skip_cache', true);
