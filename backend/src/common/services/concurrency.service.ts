import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Service for handling race conditions and concurrent updates
 */
@Injectable()
export class ConcurrencyService {
  private readonly logger = new Logger(ConcurrencyService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Executes an operation with optimistic locking retry logic
   * @param operation - The database operation to execute
   * @param maxRetries - Maximum number of retries
   * @param retryDelay - Delay between retries in milliseconds
   */
  async withOptimisticLocking<T>(
    operation: () => Promise<T>,
    maxRetries = 3,
    retryDelay = 100,
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;

        // Check if it's a transaction conflict
        if (
          error.code === 'P2034' || // Prisma transaction conflict
          error.message?.includes('deadlock') ||
          error.message?.includes('could not serialize')
        ) {
          this.logger.warn(
            `Transaction conflict detected, retry attempt ${attempt + 1}/${maxRetries}`,
          );

          if (attempt < maxRetries - 1) {
            // Exponential backoff
            await this.delay(retryDelay * Math.pow(2, attempt));
            continue;
          }
        }

        // If it's not a transaction conflict, throw immediately
        throw error;
      }
    }

    throw lastError;
  }

  /**
   * Executes a database operation within a transaction with retry logic
   */
  async withTransaction<T>(
    operation: (tx: any) => Promise<T>,
    maxRetries = 3,
  ): Promise<T> {
    return this.withOptimisticLocking(
      () => this.prisma.$transaction(operation),
      maxRetries,
    );
  }

  /**
   * Acquires a distributed lock for a given key
   * Uses PostgreSQL advisory locks
   */
  async acquireLock(lockKey: string, timeoutMs = 5000): Promise<boolean> {
    const lockId = this.stringToLockId(lockKey);

    try {
      const result = await this.prisma.$queryRaw<any[]>`
        SELECT pg_try_advisory_lock(${lockId}) as locked
      `;

      if (result[0]?.locked) {
        // Set a timeout to auto-release the lock
        setTimeout(() => this.releaseLock(lockKey), timeoutMs);
        return true;
      }

      return false;
    } catch (error) {
      this.logger.error(`Failed to acquire lock for ${lockKey}:`, error);
      return false;
    }
  }

  /**
   * Releases a distributed lock for a given key
   */
  async releaseLock(lockKey: string): Promise<boolean> {
    const lockId = this.stringToLockId(lockKey);

    try {
      await this.prisma.$queryRaw`
        SELECT pg_advisory_unlock(${lockId})
      `;
      return true;
    } catch (error) {
      this.logger.error(`Failed to release lock for ${lockKey}:`, error);
      return false;
    }
  }

  /**
   * Executes an operation with a distributed lock
   */
  async withLock<T>(
    lockKey: string,
    operation: () => Promise<T>,
    timeoutMs = 5000,
  ): Promise<T> {
    const acquired = await this.acquireLock(lockKey, timeoutMs);

    if (!acquired) {
      throw new Error(`Could not acquire lock for ${lockKey} within timeout`);
    }

    try {
      return await operation();
    } finally {
      await this.releaseLock(lockKey);
    }
  }

  /**
   * Converts a string to a numeric lock ID
   */
  private stringToLockId(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Delays execution
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Checks if a record was modified since it was read (optimistic locking check)
   */
  async isRecordModified(
    table: string,
    id: string,
    expectedUpdatedAt: Date,
  ): Promise<boolean> {
    const record = await this.prisma[table].findUnique({
      where: { id },
      select: { updatedAt: true },
    });

    if (!record) {
      return true; // Record deleted
    }

    return record.updatedAt.getTime() !== expectedUpdatedAt.getTime();
  }
}
