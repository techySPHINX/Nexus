import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Service to help prevent N+1 queries and optimize database queries
 */
@Injectable()
export class QueryOptimizerService {
  private readonly logger = new Logger(QueryOptimizerService.name);
  private queryLog: Array<{
    query: string;
    duration: number;
    timestamp: number;
  }> = [];

  constructor(private prisma: PrismaService) {
    this.setupQueryLogging();
  }

  /**
   * Setup query logging to detect N+1 problems
   */
  private setupQueryLogging(): void {
    // Enable Prisma query logging in development
    if (process.env.NODE_ENV === 'development') {
      this.prisma.$on('query' as never, (e: any) => {
        this.queryLog.push({
          query: e.query,
          duration: e.duration,
          timestamp: Date.now(),
        });

        // Keep only last 1000 queries
        if (this.queryLog.length > 1000) {
          this.queryLog.shift();
        }

        // Log slow queries
        if (e.duration > 100) {
          this.logger.warn(`Slow query (${e.duration}ms): ${e.query}`);
        }
      });
    }
  }

  /**
   * Detect potential N+1 query problems
   */
  detectN1Problems(): Array<{
    pattern: string;
    count: number;
    avgDuration: number;
  }> {
    const recentQueries = this.queryLog.filter(
      (q) => Date.now() - q.timestamp < 5000, // Last 5 seconds
    );

    // Group similar queries
    const queryGroups = new Map<string, number[]>();

    for (const log of recentQueries) {
      // Normalize query by removing parameters
      const normalized = log.query
        .replace(/\$\d+/g, '$N')
        .replace(/'.+?'/g, "'X'");

      if (!queryGroups.has(normalized)) {
        queryGroups.set(normalized, []);
      }
      queryGroups.get(normalized).push(log.duration);
    }

    // Find queries executed multiple times in short period
    const problems: Array<{
      pattern: string;
      count: number;
      avgDuration: number;
    }> = [];

    for (const [pattern, durations] of queryGroups) {
      if (durations.length > 5) {
        // Likely N+1 if same query executed > 5 times
        const avgDuration =
          durations.reduce((a, b) => a + b, 0) / durations.length;
        problems.push({
          pattern,
          count: durations.length,
          avgDuration,
        });
      }
    }

    return problems;
  }

  /**
   * Get query statistics
   */
  getQueryStats(): {
    totalQueries: number;
    avgDuration: number;
    slowQueries: number;
    recentN1Problems: number;
  } {
    const recentQueries = this.queryLog.filter(
      (q) => Date.now() - q.timestamp < 60000, // Last minute
    );

    const totalDuration = recentQueries.reduce((sum, q) => sum + q.duration, 0);
    const slowQueries = recentQueries.filter((q) => q.duration > 100).length;
    const n1Problems = this.detectN1Problems().length;

    return {
      totalQueries: recentQueries.length,
      avgDuration:
        recentQueries.length > 0 ? totalDuration / recentQueries.length : 0,
      slowQueries,
      recentN1Problems: n1Problems,
    };
  }

  /**
   * Common query patterns to prevent N+1
   */
  getUserWithRelations(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: {
          include: {
            skills: true,
            endorsements: true,
          },
        },
        requestedConnections: {
          where: { status: 'ACCEPTED' },
          include: {
            recipient: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        receivedConnections: {
          where: { status: 'ACCEPTED' },
          include: {
            requester: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Get posts with all relations in single query
   */
  getPostsWithRelations(options: {
    skip?: number;
    take?: number;
    where?: any;
  }) {
    return this.prisma.post.findMany({
      ...options,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            profile: {
              select: {
                avatarUrl: true,
              },
            },
          },
        },
        subCommunity: {
          select: {
            id: true,
            name: true,
          },
        },
        Comment: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                profile: {
                  select: {
                    avatarUrl: true,
                  },
                },
              },
            },
          },
        },
        Vote: {
          select: {
            type: true,
            userId: true,
          },
        },
      },
    });
  }

  /**
   * Get messages with relations (prevent N+1)
   */
  getMessagesWithUsers(options: {
    userId: string;
    otherUserId: string;
    skip?: number;
    take?: number;
  }) {
    return this.prisma.message.findMany({
      where: {
        OR: [
          { senderId: options.userId, receiverId: options.otherUserId },
          { senderId: options.otherUserId, receiverId: options.userId },
        ],
      },
      skip: options.skip || 0,
      take: options.take || 20,
      orderBy: { timestamp: 'desc' },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            profile: {
              select: {
                avatarUrl: true,
              },
            },
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
            email: true,
            profile: {
              select: {
                avatarUrl: true,
              },
            },
          },
        },
        readReceipts: {
          select: {
            userId: true,
            readAt: true,
          },
        },
      },
    });
  }
}
