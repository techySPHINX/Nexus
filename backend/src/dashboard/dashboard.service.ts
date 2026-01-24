import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ConnectionService } from 'src/connection/connection.service';

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly connectionService: ConnectionService,
  ) {}

  async getDashboardStats(userId: string) {
    // Reuse connection service for connection related stats
    const connectionStats = await this.connectionService.getConnectionStats(
      userId,
    );

    // Fetch gender from profile (nullable string)
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
      select: { gender: true },
    });

    return {
      ...connectionStats,
      gender: profile?.gender ?? null,
    };
  }
}
