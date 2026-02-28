import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/services/api', () => ({
  default: {
    get: vi.fn(),
  },
}));

import api from '@/services/api';
import newsService from '@/services/newsService';

const mockedApi = vi.mocked(api, true);

describe('NewsService edge regressions', () => {
  beforeEach(() => vi.clearAllMocks());

  it('must clamp invalid pagination to safe defaults (page >= 1, limit > 0)', async () => {
    mockedApi.get.mockResolvedValueOnce({ data: [] } as never);

    await newsService.list({ page: 0, limit: 0 });

    expect(mockedApi.get).toHaveBeenCalledWith('/news', {
      params: { skip: 0, take: 20 },
    });
  });
});
