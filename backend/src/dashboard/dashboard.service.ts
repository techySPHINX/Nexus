import { Injectable } from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { ConnectionService } from 'src/connection/connection.service';
import { UpdateDashboardConfigDto } from './dto/update-dashboard-config.dto';

type DashboardLayoutItem = {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

type DashboardWidgetConfig = {
  visible: boolean;
  settings?: Record<string, unknown>;
};

type DashboardConfigPayload = {
  layout: DashboardLayoutItem[];
  widgets: Record<string, DashboardWidgetConfig>;
  preset: 'STUDENT' | 'ALUM' | 'ADMIN';
};

type DashboardConfigRow = {
  layout: Prisma.JsonValue;
  widgets: Prisma.JsonValue;
  preset: string | null;
};

const DEFAULT_WIDGETS = [
  'connection_stats',
  'message_activity',
  'profile',
  'community',
  'referrals',
  'events',
  'leaderboard',
  'quick_actions',
  'alumni_post_engagement',
  'admin_platform_health',
  'admin_moderation_queue',
] as const;

const PRESET_LAYOUTS: Record<
  'STUDENT' | 'ALUM' | 'ADMIN',
  DashboardLayoutItem[]
> = {
  STUDENT: [
    { i: 'profile', x: 0, y: 0, w: 4, h: 3 },
    { i: 'quick_actions', x: 4, y: 0, w: 4, h: 3 },
    { i: 'connection_stats', x: 8, y: 0, w: 4, h: 3 },
    { i: 'message_activity', x: 0, y: 3, w: 6, h: 4 },
    { i: 'events', x: 6, y: 3, w: 6, h: 4 },
    { i: 'community', x: 0, y: 7, w: 6, h: 4 },
    { i: 'referrals', x: 6, y: 7, w: 6, h: 4 },
    { i: 'leaderboard', x: 0, y: 11, w: 12, h: 4 },
  ],
  ALUM: [
    { i: 'quick_actions', x: 0, y: 0, w: 4, h: 3 },
    { i: 'connection_stats', x: 4, y: 0, w: 4, h: 3 },
    { i: 'alumni_post_engagement', x: 8, y: 0, w: 4, h: 3 },
    { i: 'community', x: 0, y: 3, w: 6, h: 4 },
    { i: 'events', x: 6, y: 3, w: 6, h: 4 },
    { i: 'message_activity', x: 0, y: 7, w: 6, h: 4 },
    { i: 'referrals', x: 6, y: 7, w: 6, h: 4 },
    { i: 'leaderboard', x: 0, y: 11, w: 12, h: 4 },
  ],
  ADMIN: [
    { i: 'admin_platform_health', x: 0, y: 0, w: 6, h: 3 },
    { i: 'admin_moderation_queue', x: 6, y: 0, w: 6, h: 3 },
    { i: 'message_activity', x: 0, y: 3, w: 4, h: 3 },
    { i: 'connection_stats', x: 4, y: 3, w: 4, h: 3 },
    { i: 'events', x: 8, y: 3, w: 4, h: 3 },
    { i: 'leaderboard', x: 0, y: 6, w: 8, h: 4 },
    { i: 'quick_actions', x: 8, y: 6, w: 4, h: 4 },
  ],
};

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly connectionService: ConnectionService,
  ) {}

  async getDashboardStats(userId: string) {
    const connectionStats =
      await this.connectionService.getConnectionStats(userId);

    const profile = await this.prisma.profile.findUnique({
      where: { userId },
      select: { gender: true },
    });

    return {
      ...connectionStats,
      gender: profile?.gender ?? null,
    };
  }

  private resolvePreset(role?: Role): 'STUDENT' | 'ALUM' | 'ADMIN' {
    if (role === 'ADMIN') return 'ADMIN';
    if (role === 'ALUM') return 'ALUM';
    return 'STUDENT';
  }

  private buildDefaultWidgets() {
    return DEFAULT_WIDGETS.reduce<Record<string, DashboardWidgetConfig>>(
      (acc, id) => {
        acc[id] = { visible: true, settings: {} };
        return acc;
      },
      {},
    );
  }

  private buildDefaultConfig(role?: Role): DashboardConfigPayload {
    const preset = this.resolvePreset(role);
    return {
      preset,
      layout: PRESET_LAYOUTS[preset],
      widgets: this.buildDefaultWidgets(),
    };
  }

  private mapConfigRow(
    row: DashboardConfigRow,
    fallback: DashboardConfigPayload,
  ): DashboardConfigPayload {
    const layout = Array.isArray(row.layout)
      ? (row.layout as DashboardLayoutItem[])
      : fallback.layout;
    const widgets =
      row.widgets && typeof row.widgets === 'object' && !Array.isArray(row.widgets)
        ? (row.widgets as Record<string, DashboardWidgetConfig>)
        : fallback.widgets;
    const preset =
      row.preset === 'STUDENT' || row.preset === 'ALUM' || row.preset === 'ADMIN'
        ? row.preset
        : fallback.preset;

    return { layout, widgets, preset };
  }

  private async findDashboardConfig(userId: string) {
    const rows = await this.prisma.$queryRaw<DashboardConfigRow[]>`
      SELECT "layout", "widgets", "preset"
      FROM "dashboard_configs"
      WHERE "userId" = ${userId}
      LIMIT 1
    `;
    return rows[0] ?? null;
  }

  private async createDashboardConfig(
    userId: string,
    payload: DashboardConfigPayload,
  ) {
    const rows = await this.prisma.$queryRaw<DashboardConfigRow[]>`
      INSERT INTO "dashboard_configs" ("userId", "layout", "widgets", "preset")
      VALUES (
        ${userId},
        CAST(${JSON.stringify(payload.layout)} AS jsonb),
        CAST(${JSON.stringify(payload.widgets)} AS jsonb),
        ${payload.preset}
      )
      RETURNING "layout", "widgets", "preset"
    `;
    return rows[0];
  }

  private async upsertDashboardConfigRow(
    userId: string,
    payload: DashboardConfigPayload,
  ) {
    const rows = await this.prisma.$queryRaw<DashboardConfigRow[]>`
      INSERT INTO "dashboard_configs" ("userId", "layout", "widgets", "preset")
      VALUES (
        ${userId},
        CAST(${JSON.stringify(payload.layout)} AS jsonb),
        CAST(${JSON.stringify(payload.widgets)} AS jsonb),
        ${payload.preset}
      )
      ON CONFLICT ("userId")
      DO UPDATE SET
        "layout" = EXCLUDED."layout",
        "widgets" = EXCLUDED."widgets",
        "preset" = EXCLUDED."preset",
        "updatedAt" = NOW()
      RETURNING "layout", "widgets", "preset"
    `;
    return rows[0];
  }

  async getDashboardConfig(userId: string) {
    const existing = await this.findDashboardConfig(userId);

    if (existing) {
      return this.mapConfigRow(existing, this.buildDefaultConfig());
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    const defaults = this.buildDefaultConfig(user?.role);

    const created = await this.createDashboardConfig(userId, defaults);
    return this.mapConfigRow(created, defaults);
  }

  async upsertDashboardConfig(userId: string, dto: UpdateDashboardConfigDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    const defaults = this.buildDefaultConfig(user?.role);

    const data: DashboardConfigPayload = {
      layout: dto.layout,
      widgets: dto.widgets ?? defaults.widgets,
      preset: dto.preset ?? defaults.preset,
    };

    const config = await this.upsertDashboardConfigRow(userId, data);
    return this.mapConfigRow(config, data);
  }
}
