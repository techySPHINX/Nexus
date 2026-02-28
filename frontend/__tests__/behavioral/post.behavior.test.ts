import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockApi } = vi.hoisted(() => ({
  mockApi: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    interceptors: {
      request: {
        use: vi.fn(),
      },
    },
  },
}));

vi.mock('axios', () => {
  const axiosMock = {
    create: vi.fn(() => mockApi),
    isAxiosError: vi.fn(() => false),
  };
  return {
    default: axiosMock,
    ...axiosMock,
  };
});

vi.mock('jwt-decode', () => ({
  jwtDecode: vi.fn(() => ({ role: 'ALUM' })),
}));

import { getRecentPostsService } from '@/services/PostService';

describe('Post domain behavior', () => {
  beforeEach(() => vi.clearAllMocks());

  it('requests recent posts with page and limit params', async () => {
    mockApi.get.mockResolvedValueOnce({ data: { data: [] } } as never);

    await getRecentPostsService(1, 5);

    expect(mockApi.get).toHaveBeenCalledWith('/posts/recent', {
      params: { page: 1, limit: 5 },
    });
  });
});
