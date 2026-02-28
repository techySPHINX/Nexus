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
import newsService from '@/services/newsService';

const mockedApi = vi.mocked(api, true);

describe('behavior news: NewsService', () => {
  beforeEach(() => vi.clearAllMocks());

  it('computes skip/take from page/limit', async () => {
    mockedApi.get.mockResolvedValueOnce({ data: { data: [] } } as never);

    await newsService.list({ page: 2, limit: 15 });

    expect(mockedApi.get).toHaveBeenCalledWith('/news', {
      params: { skip: 15, take: 15 },
    });
  });

  it('encodes slug in getBySlug path', async () => {
    mockedApi.get.mockResolvedValueOnce({ data: {} } as never);

    await newsService.getBySlug('ai/2026 trends');

    expect(mockedApi.get).toHaveBeenCalledWith('/news/ai%2F2026%20trends');
  });
});
