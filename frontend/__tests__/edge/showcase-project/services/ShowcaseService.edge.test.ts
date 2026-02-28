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

describe('edge: src/services/ShowcaseService.tsx', () => {
  beforeEach(() => vi.clearAllMocks());

  it('clamps comments page to 1 when caller passes 0 or negative values', async () => {
    mockedApi.get.mockResolvedValueOnce({
      data: { comments: [], pagination: { page: 1 } },
    } as never);

    await ShowcaseService.getComments('project-1', 0);

    expect(mockedApi.get).toHaveBeenCalledWith('/showcase/project-1/comments', {
      params: { page: 1 },
    });
  });
});
