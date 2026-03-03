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
import { ShowcaseService } from '@/services/ShowcaseService';

const mockedApi = vi.mocked(api, true);

describe('behavior startup: ShowcaseService', () => {
  beforeEach(() => vi.clearAllMocks());

  it('passes startup filters as query params', async () => {
    mockedApi.get.mockResolvedValueOnce({ data: { data: [] } } as never);

    await ShowcaseService.getStartups({ search: 'ai', pageSize: 12 });

    expect(mockedApi.get).toHaveBeenCalledWith('/showcase/startup', {
      params: { search: 'ai', pageSize: 12 },
    });
  });

  it('hits follow and unfollow startup endpoints', async () => {
    mockedApi.post.mockResolvedValueOnce({ data: {} } as never);
    mockedApi.delete.mockResolvedValueOnce({ data: {} } as never);

    await ShowcaseService.followStartup('s1');
    await ShowcaseService.unfollowStartup('s1');

    expect(mockedApi.post).toHaveBeenCalledWith('/showcase/startup/s1/follow');
    expect(mockedApi.delete).toHaveBeenCalledWith(
      '/showcase/startup/s1/follow'
    );
  });
});
