import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockApi } = vi.hoisted(() => ({
  mockApi: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    interceptors: { request: { use: vi.fn() } },
  },
}));

vi.mock('axios', () => {
  const axiosMock = {
    create: vi.fn(() => mockApi),
    isAxiosError: vi.fn(() => false),
  };
  return { default: axiosMock, ...axiosMock };
});

vi.mock('jwt-decode', () => ({ jwtDecode: vi.fn(() => ({ role: 'ALUM' })) }));

import {
  getFeedService,
  getSubCommunityFeedService,
} from '@/services/PostService';

describe('Feed service edge regressions', () => {
  beforeEach(() => vi.clearAllMocks());

  it('must pass pagination when loading feed', async () => {
    mockApi.get.mockResolvedValueOnce({ data: { data: [] } } as never);

    await getFeedService(2, 15);

    expect(mockApi.get).toHaveBeenCalledWith('/posts/feed', {
      params: { page: 2, limit: 15 },
    });
  });

  it('must include sub-community id in feed path', async () => {
    mockApi.get.mockResolvedValueOnce({ data: { data: [] } } as never);

    await getSubCommunityFeedService('sc-1', 1, 10);

    expect(mockApi.get).toHaveBeenCalledWith('/posts/subcommunity/sc-1/feed', {
      params: { page: 1, limit: 10 },
    });
  });
});
