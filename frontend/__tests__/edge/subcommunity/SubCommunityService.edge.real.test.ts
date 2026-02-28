import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/services/api', () => ({
  default: {
    get: vi.fn(),
  },
}));

import api from '@/services/api';
import { subCommunityService } from '@/services/subCommunityService';

const mockedApi = vi.mocked(api, true);

describe('edge subcommunity: subCommunityService', () => {
  beforeEach(() => vi.clearAllMocks());

  it('clamps invalid page/limit in getSubCommunityByType', async () => {
    mockedApi.get.mockResolvedValueOnce({
      data: { data: [], pagination: {} },
    } as never);

    await subCommunityService.getSubCommunityByType('TECH', 0, -2);

    expect(mockedApi.get).toHaveBeenCalledWith('/sub-community/type/TECH', {
      params: { page: 1, limit: 20 },
    });
  });

  it('omits non-positive page/limit in getAllSubCommunities', async () => {
    mockedApi.get.mockResolvedValueOnce({ data: [] } as never);

    await subCommunityService.getAllSubCommunities({
      compact: false,
      page: 0,
      limit: -5,
    });

    expect(mockedApi.get).toHaveBeenCalledWith('/sub-community', {
      params: { compact: false },
    });
  });
});
