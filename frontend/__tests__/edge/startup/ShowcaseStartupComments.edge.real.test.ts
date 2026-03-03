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

describe('edge startup: ShowcaseService.getStartupComments', () => {
  beforeEach(() => vi.clearAllMocks());

  it('clamps startup comments page to 1 when caller passes 0', async () => {
    mockedApi.get.mockResolvedValueOnce({ data: { comments: [] } } as never);

    await ShowcaseService.getStartupComments('startup-1', 0);

    expect(mockedApi.get).toHaveBeenCalledWith(
      '/showcase/startup/startup-1/comments',
      {
        params: { page: 1 },
      }
    );
  });
});
