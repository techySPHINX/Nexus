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

import { createPostService } from '@/services/PostService';

describe('PostService edge regressions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('token', 'fake-token');
  });

  it('must reject creating post when subject/content are empty', async () => {
    mockApi.post.mockResolvedValueOnce({ data: { id: 'post-1' } } as never);

    await expect(createPostService('', '', undefined)).rejects.toThrow(
      /subject|content|required/i
    );
  });
});
