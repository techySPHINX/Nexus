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

describe('Gamification domain behavior', () => {
  beforeEach(() => vi.clearAllMocks());

  it('requests leaderboard with query string period and limit', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: [{ id: 'u1' }] } as never);

    const result = await gamificationService.getLeaderboard('month', 5);

    expect(mockedAxios.get).toHaveBeenCalledWith(
      '/gamification/leaderboard?period=month&limit=5'
    );
    expect(result).toEqual([{ id: 'u1' }]);
  });
});
