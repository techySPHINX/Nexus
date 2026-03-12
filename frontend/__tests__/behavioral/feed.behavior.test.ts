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
import { getCommunityFeedService } from '@/services/PostService';

describe('Feed domain behavior', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('calls feed endpoint with pagination params', async () => {
    mockApi.get.mockResolvedValueOnce({ data: { data: [] } } as never);

    await getFeedService(2, 10);

    expect(mockApi.get).toHaveBeenCalledWith('/posts/feed', {
      params: { page: 2, limit: 10 },
    });
  });

  it('calls community feed endpoint with pagination params', async () => {
    mockApi.get.mockResolvedValueOnce({ data: { data: [] } } as never);

    await getCommunityFeedService(3, 8);

    expect(mockApi.get).toHaveBeenCalledWith('/posts/community-feed', {
      params: { page: 3, limit: 8 },
    });
  });

  it('throws fallback message when feed request fails', async () => {
    mockApi.get.mockRejectedValueOnce({
      response: { data: { message: 'Feed unavailable' } },
    } as never);

    await expect(getFeedService(1, 10)).rejects.toThrow('Failed to fetch feed');
  });
});
