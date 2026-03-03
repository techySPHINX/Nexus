import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/services/api', () => ({
  default: {
    get: vi.fn(),
  },
}));

import api from '@/services/api';
import newsService from '@/services/newsService';

const mockedApi = vi.mocked(api, true);

describe('edge news: NewsService', () => {
  beforeEach(() => vi.clearAllMocks());

  it('clamps invalid pagination to page=1 and limit=20', async () => {
    mockedApi.get.mockResolvedValueOnce({ data: [] } as never);

    await newsService.list({ page: -1, limit: -5 });

    expect(mockedApi.get).toHaveBeenCalledWith('/news', {
      params: { skip: 0, take: 20 },
    });
  });
});
