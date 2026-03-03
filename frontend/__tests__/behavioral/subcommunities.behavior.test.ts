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

  it('sanitizes invalid page and limit when fetching list', async () => {
    mockedApi.get.mockResolvedValueOnce({ data: [] } as never);

    await subCommunityService.getAllSubCommunities({
      compact: false,
      page: -5,
      limit: 0,
    });

    expect(mockedApi.get).toHaveBeenCalledWith('/sub-community', {
      params: { compact: false },
    });
  });

  it('uses safe pagination defaults and search query for type list', async () => {
    mockedApi.get.mockResolvedValueOnce({
      data: { data: [{ id: 's1' }], pagination: { page: 1, limit: 20 } },
    } as never);

    await subCommunityService.getSubCommunityByType('tech', -1, -10, 'ai');

    expect(mockedApi.get).toHaveBeenCalledWith('/sub-community/type/tech', {
      params: { page: 1, limit: 20, q: 'ai' },
    });
  });

  it('sends join request and report handling payload to correct endpoints', async () => {
    mockedApi.post.mockResolvedValueOnce({ data: { id: 'jr1' } } as never);
    mockedApi.patch.mockResolvedValueOnce({ data: {} } as never);

    await subCommunityService.requestToJoin('sub-1');
    await subCommunityService.handleReport('sub-1', 'rep-1', 'RESOLVED');

    expect(mockedApi.post).toHaveBeenCalledWith(
      '/sub-community/sub-1/join-request'
    );
    expect(mockedApi.patch).toHaveBeenCalledWith(
      '/sub-community/sub-1/reports/rep-1',
      { status: 'RESOLVED' }
    );
  });
});
