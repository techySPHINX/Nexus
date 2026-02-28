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

describe('Showcase domain behavior', () => {
  beforeEach(() => vi.clearAllMocks());

  it('passes filter params when loading all projects', async () => {
    mockedApi.get.mockResolvedValueOnce({
      data: { data: [], pagination: { hasNext: false } },
    } as never);

    await ShowcaseService.getAllProjects({ search: 'ai', pageSize: 12 });

    expect(mockedApi.get).toHaveBeenCalledWith('/showcase/project', {
      params: { search: 'ai', pageSize: 12 },
    });
  });
});
