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
});
