import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

import api from '@/services/api';
import { ShowcaseService } from '@/services/ShowcaseService';

const mockedApi = vi.mocked(api, true);

describe('Startup ShowcaseService edge regressions', () => {
  beforeEach(() => vi.clearAllMocks());

  it('must pass startup filters as query params', async () => {
    mockedApi.get.mockResolvedValueOnce({ data: { data: [] } } as never);

    await ShowcaseService.getStartups({ search: 'ai', pageSize: 12 });

    expect(mockedApi.get).toHaveBeenCalledWith('/showcase/startup', {
      params: { search: 'ai', pageSize: 12 },
    });
  });

  it('must call follow/unfollow startup endpoints with id', async () => {
    mockedApi.post.mockResolvedValueOnce({ data: {} } as never);
    mockedApi.delete.mockResolvedValueOnce({ data: {} } as never);

    await ShowcaseService.followStartup('st-1');
    await ShowcaseService.unfollowStartup('st-1');

    expect(mockedApi.post).toHaveBeenCalledWith(
      '/showcase/startup/st-1/follow'
    );
    expect(mockedApi.delete).toHaveBeenCalledWith(
      '/showcase/startup/st-1/follow'
    );
  });
});
