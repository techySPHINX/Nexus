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

  it('requests user points by user id', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: { points: 120 } } as never);

    const result = await gamificationService.getUserPoints('user-2');

    expect(mockedAxios.get).toHaveBeenCalledWith('/gamification/points/user-2');
    expect(result).toEqual({ points: 120 });
  });

  it('requests transactions with limit query', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: [{ id: 't1' }] } as never);

    const result = await gamificationService.getTransactions('user-2', 15);

    expect(mockedAxios.get).toHaveBeenCalledWith(
      '/gamification/transactions/user-2?limit=15'
    );
    expect(result).toEqual([{ id: 't1' }]);
  });

  it('posts award payload to award endpoint', async () => {
    mockedAxios.post.mockResolvedValueOnce({ data: { ok: true } } as never);

    const payload = {
      userId: 'u3',
      points: 40,
      type: 'POST_CREATED',
      entityId: 'post-9',
    };

    const result = await gamificationService.awardPoints(payload);

    expect(mockedAxios.post).toHaveBeenCalledWith(
      '/gamification/award',
      payload
    );
    expect(result).toEqual({ ok: true });
  });
});
