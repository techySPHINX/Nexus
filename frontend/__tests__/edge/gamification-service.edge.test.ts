import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

import axios from 'axios';
import gamificationService from '@/services/gamificationService';

const mockedAxios = vi.mocked(axios, true);

describe('Gamification service edge regressions', () => {
  beforeEach(() => vi.clearAllMocks());

  it('must pass period and limit through leaderboard query', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: [] } as never);

    await gamificationService.getLeaderboard('week', 7);

    expect(mockedAxios.get).toHaveBeenCalledWith(
      '/gamification/leaderboard?period=week&limit=7'
    );
  });

  it('must include user id when fetching transactions', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: [] } as never);

    await gamificationService.getTransactions('u-2', 5);

    expect(mockedAxios.get).toHaveBeenCalledWith(
      '/gamification/transactions/u-2?limit=5'
    );
  });
});
