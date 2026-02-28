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

vi.mock('jwt-decode', () => ({
  jwtDecode: vi.fn(() => ({ role: 'STUDENT' })),
}));

import { getPendingPostsService } from '@/services/PostService';

describe('PostService authorization edge regressions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('token', 'fake-token');
  });

  it('must block non-admin users from pending posts endpoint', async () => {
    await expect(getPendingPostsService(1, 10)).rejects.toThrow(/Only admins/i);
  });
});
