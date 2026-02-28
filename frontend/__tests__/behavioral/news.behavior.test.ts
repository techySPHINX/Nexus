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

describe('News domain behavior', () => {
  beforeEach(() => vi.clearAllMocks());

  it('computes skip/take from page/limit when listing news', async () => {
    mockedApi.get.mockResolvedValueOnce({ data: { data: [] } } as never);

    await newsService.list({ page: 2, limit: 20 });

    expect(mockedApi.get).toHaveBeenCalledWith('/news', {
      params: { skip: 20, take: 20 },
    });
  });
});
