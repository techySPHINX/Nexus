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

import {
  fetchProfileDataService,
  searchedProfileDataService,
  getProfilePreviewService,
  updateProfileService,
} from '@/services/profileService';

describe('Profile domain behavior', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

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

  it('loads searched profile and badges together', async () => {
    mockApi.get
      .mockResolvedValueOnce({ data: { id: 'u2', name: 'Riya' } } as never)
      .mockResolvedValueOnce({ data: [{ id: 'b7' }] } as never);

    const result = await searchedProfileDataService('u2');

    expect(mockApi.get).toHaveBeenNthCalledWith(1, '/profile/u2');
    expect(mockApi.get).toHaveBeenNthCalledWith(2, '/profile/u2/badges');
    expect(result).toEqual({
      SearchedProfile: { id: 'u2', name: 'Riya' },
      Badges: [{ id: 'b7' }],
    });
  });

  it('requests profile preview with avatarUrl filter', async () => {
    mockApi.get.mockResolvedValueOnce({
      data: { user: { id: 'u9' } },
    } as never);

    await getProfilePreviewService('u9', true);

    expect(mockApi.get).toHaveBeenCalledWith('/profile/u9/preview', {
      params: { avatarUrl: true },
    });
  });

  it('throws fallback message when update profile fails', async () => {
    mockApi.put.mockRejectedValueOnce({
      response: { data: { message: 'Profile update rejected' } },
    } as never);

    await expect(
      updateProfileService('u1', {
        bio: 'new bio',
        location: 'blr',
        interests: 'ai,web',
        avatarUrl: '',
        skills: [],
      })
    ).rejects.toThrow('Failed to update profile');
  });
});
