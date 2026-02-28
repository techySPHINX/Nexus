import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/services/api', () => ({
  default: { get: vi.fn(), post: vi.fn() },
}));

import api from '@/services/api';
import { DashBoardService } from '@/services/DashBoardService';

const mockedApi = vi.mocked(api, true);

describe('DashBoardService edge regressions', () => {
  beforeEach(() => vi.clearAllMocks());

  it('must default suggested-connections limit to 10', async () => {
    mockedApi.get.mockResolvedValueOnce({ data: { suggestions: [] } } as never);

    await DashBoardService.getSuggestedConnections(undefined);

    expect(mockedApi.get).toHaveBeenCalledWith('/connection/suggestions', {
      params: { limit: 10 },
    });
  });

  it('must pass recipient id when connecting to user', async () => {
    mockedApi.post.mockResolvedValueOnce({ data: {} } as never);

    await DashBoardService.connectToUser('u-1');

    expect(mockedApi.post).toHaveBeenCalledWith('/connection/send', {
      recipientId: 'u-1',
    });
  });
});
