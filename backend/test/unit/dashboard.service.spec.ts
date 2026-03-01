import { DashboardService } from '../../src/dashboard/dashboard.service';

describe('DashboardService', () => {
  const prisma = {
    $queryRaw: jest.fn(),
    profile: { findUnique: jest.fn() },
    user: { findUnique: jest.fn() },
  } as any;

  const connectionService = {
    getConnectionStats: jest.fn(),
  } as any;

  let service: DashboardService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new DashboardService(prisma, connectionService);
  });

  it('returns persisted config when present', async () => {
    prisma.$queryRaw.mockResolvedValueOnce([
      {
      layout: [{ i: 'profile', x: 0, y: 0, w: 4, h: 3 }],
      widgets: { profile: { visible: true } },
      preset: 'STUDENT',
      },
    ]);

    const result = await service.getDashboardConfig('u1');

    expect(result.preset).toBe('STUDENT');
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it('creates default config for new user', async () => {
    prisma.$queryRaw.mockResolvedValueOnce([]);
    prisma.user.findUnique.mockResolvedValue({ role: 'ADMIN' });
    prisma.$queryRaw.mockResolvedValueOnce([
      {
        layout: [],
        widgets: {},
        preset: 'ADMIN',
      },
    ]);

    await service.getDashboardConfig('u2');

    expect(prisma.$queryRaw).toHaveBeenCalledTimes(2);
  });

  it('upserts config payload', async () => {
    prisma.user.findUnique.mockResolvedValue({ role: 'STUDENT' });
    prisma.$queryRaw.mockResolvedValueOnce([
      {
        layout: [{ i: 'events', x: 0, y: 0, w: 4, h: 3 }],
        widgets: { events: { visible: true } },
        preset: 'STUDENT',
      },
    ]);

    const result = await service.upsertDashboardConfig('u3', {
      layout: [{ i: 'events', x: 0, y: 0, w: 4, h: 3 }],
      widgets: { events: { visible: true } },
      preset: 'STUDENT',
    });

    expect(result.layout).toHaveLength(1);
    expect(prisma.$queryRaw).toHaveBeenCalledTimes(1);
  });
});
