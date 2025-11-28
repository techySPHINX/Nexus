import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
type Period = 'all' | 'day' | 'week' | 'month';

export enum GamificationEvent {
  POST_CREATED = 'POST_CREATED',
  COMMENT_CREATED = 'COMMENT_CREATED',
  COMMENT_REPLY = 'COMMENT_REPLY',
  PROJECT_COMMENT = 'PROJECT_COMMENT',
  STARTUP_COMMENT = 'STARTUP_COMMENT',
  PROJECT_CREATED = 'PROJECT_CREATED',
  STARTUP_CREATED = 'STARTUP_CREATED',
  CONNECTION_STUDENT = 'CONNECTION_STUDENT',
  CONNECTION_ALUMNI = 'CONNECTION_ALUMNI',
  LIKE_RECEIVED = 'LIKE_RECEIVED',
  REFERRAL_POSTED = 'REFERRAL_POSTED',
}

export interface LeaderboardEntry {
  userId: string;
  user: { id: string; name?: string | null; role?: string | null; profile?: { avatarUrl?: string | null } | null } | null;
  points: number;
}

@Injectable()
export class GamificationService {
  private readonly logger = new Logger(GamificationService.name);

  // Use a readonly map so it's not recreated every call and benefits from TS safety
  private readonly pointsMap: Readonly<Record<GamificationEvent, number>> = {
    [GamificationEvent.POST_CREATED]: 10,
    [GamificationEvent.COMMENT_CREATED]: 2,
    [GamificationEvent.COMMENT_REPLY]: 1,
    [GamificationEvent.PROJECT_COMMENT]: 3,
    [GamificationEvent.STARTUP_COMMENT]: 3,
    [GamificationEvent.PROJECT_CREATED]: 15,
    [GamificationEvent.STARTUP_CREATED]: 40,
    [GamificationEvent.CONNECTION_STUDENT]: 2,
    [GamificationEvent.CONNECTION_ALUMNI]: 3,
    [GamificationEvent.LIKE_RECEIVED]: 1,
    [GamificationEvent.REFERRAL_POSTED]: 50,
  };

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Atomically upsert the user's points and create a pointTransaction entry.
   * Returns the updated userPoints record and the transaction created.
   */
  async awardPoints(
  userId: string,
  points: number,
  type: string,
  entityId?: string,
) {
  return this.prisma.$transaction(async (tx) => {
    // Upsert userPoints record
    const userPoints = await tx.userPoints.upsert({
      where: { userId },
      update: { points: { increment: points } },
      create: { userId, points },
      select: { id: true, userId: true, points: true },
    });

    // Create the transaction entry
    const transaction = await tx.pointTransaction.create({
      data: {
        userId,
        userPointsId: userPoints.id,
        points,
        type,
        entityId: entityId ?? null,
      },
    });

    return { userPoints, transaction };
  });
}

  /** Safer wrapper that accepts a GamificationEvent enum key */
  async awardForEvent(eventKey: GamificationEvent | string, userId: string, entityId?: string) {
    const points = (this.pointsMap as Record<string, number>)[eventKey];
    if (!points) {
      this.logger.warn(`No points mapping for eventKey=${eventKey}`);
      return { success: false, message: 'Unknown eventKey' };
    }
    const res = await this.awardPoints(userId, points, eventKey, entityId);
    return { success: true, ...res };
  }

  /** Get total stored points (fast) */
  async getUserPoints(userId: string) {
    return this.prisma.userPoints.findUnique({
      where: { userId },
      select: { points: true },
    });
  }

  private getPeriodWhere(period: Period) {
  const now = new Date();

  if (period === 'day') {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    return { createdAt: { gte: start } };
  }

  if (period === 'week') {
    const start = new Date(now);
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1); // Monday start
    start.setDate(diff);
    start.setHours(0, 0, 0, 0);
    return { createdAt: { gte: start } };
  }

  if (period === 'month') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    return { createdAt: { gte: start } };
  }

  return {};
}

  /**
   * Leaderboard for a given period.
   * Implementation detail:
   *  - groupBy pointTransaction to sum points per user in timeframe
   *  - fetch user profiles in one query (no N+1)
   */
  async getLeaderboardByPeriod(period: Period = 'all', limit = 10) {
  const where = this.getPeriodWhere(period);

  const groups = await this.prisma.pointTransaction.groupBy({
    by: ['userId'],
    _sum: { points: true },
    where,
    orderBy: { _sum: { points: 'desc' } },
    take: limit,
  });

  if (groups.length === 0) return [];

  const users = await this.prisma.user.findMany({
    where: { id: { in: groups.map((g) => g.userId) } },
    select: { id: true, name: true, role: true, profile: { select: { avatarUrl: true } } },
  });

  const map = new Map(users.map((u) => [u.id, u]));

  return groups.map((g) => ({
    userId: g.userId,
    user: map.get(g.userId) ?? null,
    points: g._sum.points ?? 0,
  }));
}

  async getTopToday(limit = 10) {
    return this.getLeaderboardByPeriod('day', limit);
  }

  async getTopWeek(limit = 10) {
    return this.getLeaderboardByPeriod('week', limit);
  }

  async getTopMonth(limit = 10) {
    return this.getLeaderboardByPeriod('month', limit);
  }

  /** Get raw recent transactions for a user */
  async getRecentTransactions(userId: string, limit = 10) {
    return this.prisma.pointTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  // Utility: calculate days left (integer)
  getDaysLeft(dateIso: string | Date): number {
    const now = new Date();
    const ev = new Date(dateIso);
    const msPerDay = 1000 * 60 * 60 * 24;
    return Math.ceil((ev.getTime() - now.getTime()) / msPerDay);
  }
}