import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

import api from '@/services/api';
import { subCommunityService } from '@/services/subCommunityService';

const mockedApi = vi.mocked(api, true);

describe('SubCommunityService edge regressions', () => {
  beforeEach(() => vi.clearAllMocks());

  it('must send empty params object when no filters are provided', async () => {
    mockedApi.get.mockResolvedValueOnce({ data: [] } as never);

    await subCommunityService.getAllSubCommunities();

    expect(mockedApi.get).toHaveBeenCalledWith('/sub-community', {
      params: {},
    });
  });

  it('must include search term in type filter requests', async () => {
    mockedApi.get.mockResolvedValueOnce({
      data: { data: [], pagination: {} },
    } as never);

    await subCommunityService.getSubCommunityByType('TECH', 1, 20, 'ml');

    expect(mockedApi.get).toHaveBeenCalledWith('/sub-community/type/TECH', {
      params: { page: 1, limit: 20, q: 'ml' },
    });
  });
});
