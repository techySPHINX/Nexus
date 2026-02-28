import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

import api from '@/services/api';
import { subCommunityService } from '@/services/subCommunityService';

const mockedApi = vi.mocked(api, true);

describe('behavior subcommunity: subCommunityService', () => {
  beforeEach(() => vi.clearAllMocks());

  it('passes compact/page/limit filters to getAllSubCommunities', async () => {
    mockedApi.get.mockResolvedValueOnce({ data: [] } as never);

    await subCommunityService.getAllSubCommunities({
      compact: true,
      page: 2,
      limit: 15,
    });

    expect(mockedApi.get).toHaveBeenCalledWith('/sub-community', {
      params: { compact: true, page: 2, limit: 15 },
    });
  });

  it('includes q in type-filter endpoint requests', async () => {
    mockedApi.get.mockResolvedValueOnce({
      data: { data: [], pagination: {} },
    } as never);

    await subCommunityService.getSubCommunityByType('TECH', 1, 20, 'ml');

    expect(mockedApi.get).toHaveBeenCalledWith('/sub-community/type/TECH', {
      params: { page: 1, limit: 20, q: 'ml' },
    });
  });
});
