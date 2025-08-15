import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GamificationService {
  constructor(private prisma: PrismaService) {}

  async awardPoints(
    userId: string,
    points: number,
    type: string,
    entityId?: string,
  ) {
    // Find or create UserPoints record
    let userPoints = await this.prisma.userPoints.findUnique({
      where: { userId },
    });

    if (!userPoints) {
      userPoints = await this.prisma.userPoints.create({
        data: {
          userId,
          points,
        },
      });
    } else {
      userPoints = await this.prisma.userPoints.update({
        where: { userId },
        data: {
          points: { increment: points },
        },
      });
    }

    // Record the transaction
    await this.prisma.pointTransaction.create({
      data: {
        userId,
        userPointsId: userPoints.id,
        points,
        type,
        entityId,
      },
    });

    return userPoints;
  }

  async getUserPoints(userId: string) {
    return this.prisma.userPoints.findUnique({
      where: { userId },
      select: { points: true },
    });
  }

  async getLeaderboard(limit: number = 10) {
    return this.prisma.userPoints.findMany({
      orderBy: { points: 'desc' },
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            profile: { select: { avatarUrl: true } },
          },
        },
      },
    });
  }
}
