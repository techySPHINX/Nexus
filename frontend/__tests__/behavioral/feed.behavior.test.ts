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

import { getFeedService } from '@/services/PostService';

describe('Feed domain behavior', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calls feed endpoint with pagination params', async () => {
    mockApi.get.mockResolvedValueOnce({ data: { data: [] } } as never);

    await getFeedService(2, 10);

    expect(mockApi.get).toHaveBeenCalledWith('/posts/feed', {
      params: { page: 2, limit: 10 },
    });
  });
});
