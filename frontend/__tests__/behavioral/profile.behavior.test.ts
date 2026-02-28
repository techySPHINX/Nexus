import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockApi } = vi.hoisted(() => ({
  mockApi: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    patch: vi.fn(),
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

import { fetchProfileDataService } from '@/services/profileService';

describe('Profile domain behavior', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns profile and badges from parallel requests', async () => {
    mockApi.get
      .mockResolvedValueOnce({ data: { id: 'p1', bio: 'hello' } } as never)
      .mockResolvedValueOnce({ data: [{ id: 'b1' }] } as never);

    const result = await fetchProfileDataService('user-1');

    expect(mockApi.get).toHaveBeenNthCalledWith(1, '/profile/me');
    expect(mockApi.get).toHaveBeenNthCalledWith(2, '/profile/user-1/badges');
    expect(result).toEqual({
      profile: { id: 'p1', bio: 'hello' },
      badges: [{ id: 'b1' }],
    });
  });
});
