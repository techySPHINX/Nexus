import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    patch: vi.fn(),
  },
}));

import api from '@/services/api';
import { subCommunityService } from '@/services/subCommunityService';

const mockedApi = vi.mocked(api, true);

describe('Subcommunities domain behavior', () => {
  beforeEach(() => vi.clearAllMocks());

  it('builds query params from options for sub-community list', async () => {
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
});
