import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/services/api', () => ({
  default: {
    get: vi.fn(),
  },
}));

import api from '@/services/api';
import { subCommunityService } from '@/services/subCommunityService';

const mockedApi = vi.mocked(api, true);

describe('unit subcommunity: subCommunityService grouped loaders', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns moderated group payload from getMyModeratedSubCommunities', async () => {
    mockedApi.get.mockResolvedValueOnce({
      data: {
        moderated: {
          data: [{ id: 'sc-1', name: 'Mods' }],
          pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
        },
      },
    } as never);

    const result = await subCommunityService.getMyModeratedSubCommunities();
    expect(result.data[0].id).toBe('sc-1');
  });

  it('returns owned group payload from getMyOwnedSubCommunities', async () => {
    mockedApi.get.mockResolvedValueOnce({
      data: {
        owned: {
          data: [{ id: 'sc-2', name: 'Owned' }],
          pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
        },
      },
    } as never);

    const result = await subCommunityService.getMyOwnedSubCommunities();
    expect(result.data[0].id).toBe('sc-2');
  });
});
