import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

import api from '@/services/api';
import { DashBoardService } from '@/services/DashBoardService';

const mockedApi = vi.mocked(api, true);

describe('Dashboard domain behavior', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns suggestions array from suggested-connections endpoint', async () => {
    mockedApi.get.mockResolvedValueOnce({
      data: { suggestions: [{ id: 'u1' }] },
    } as never);

    const result = await DashBoardService.getSuggestedConnections(6);

    expect(mockedApi.get).toHaveBeenCalledWith('/connection/suggestions', {
      params: { limit: 6 },
    });
    expect(result).toEqual([{ id: 'u1' }]);
  });

  it('gets connection stats from dashboard endpoint', async () => {
    mockedApi.get.mockResolvedValueOnce({
      data: { total: 14, pendingRequests: 2 },
    } as never);

    const result = await DashBoardService.getConnectionStats();

    expect(mockedApi.get).toHaveBeenCalledWith('/dashboard/stats');
    expect(result).toEqual({ total: 14, pendingRequests: 2 });
  });

  it('posts recipient id for new connection request', async () => {
    mockedApi.post.mockResolvedValueOnce({ data: {} } as never);

    await DashBoardService.connectToUser('u-44');

    expect(mockedApi.post).toHaveBeenCalledWith('/connection/send', {
      recipientId: 'u-44',
    });
  });

  it('throws wrapped message when recent posts fetch fails', async () => {
    mockedApi.get.mockRejectedValueOnce(new Error('network down') as never);

    await expect(DashBoardService.getRecentPostsService(1, 3)).rejects.toThrow(
      'Failed to fetch recent posts'
    );
  });
});
