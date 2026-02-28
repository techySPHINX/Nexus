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

const { mockJwtDecode } = vi.hoisted(() => ({
  mockJwtDecode: vi.fn(),
}));

vi.mock('jwt-decode', () => ({
  jwtDecode: mockJwtDecode,
}));

import {
  createPostService,
  getRecentPostsService,
} from '@/services/PostService';

describe('Post domain behavior', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    localStorage.setItem('token', 'token');
    mockJwtDecode.mockReturnValue({ role: 'ALUM' });
  });

  it('requests recent posts with page and limit params', async () => {
    mockApi.get.mockResolvedValueOnce({ data: { data: [] } } as never);

    await getRecentPostsService(1, 5);

    expect(mockApi.get).toHaveBeenCalledWith('/posts/recent', {
      params: { page: 1, limit: 5 },
    });
  });

  it('creates post with normalized json payload when image is string', async () => {
    mockApi.post.mockResolvedValueOnce({ data: { id: 'p1' } } as never);

    await createPostService(
      '  Subject  ',
      '  Content  ',
      'https://img',
      'sc-1',
      'GENERAL'
    );

    expect(mockApi.post).toHaveBeenCalledWith(
      '/posts',
      {
        subject: 'Subject',
        content: 'Content',
        type: 'GENERAL',
        subCommunityId: 'sc-1',
        imageUrl: 'https://img',
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  });

  it('rejects when subject or content is blank', async () => {
    await expect(createPostService('   ', 'body')).rejects.toThrow(
      'Subject and content are required'
    );
    await expect(createPostService('subject', '   ')).rejects.toThrow(
      'Subject and content are required'
    );
  });

  it('rejects unauthorized create request for non-admin/non-alum when not in sub-community', async () => {
    mockJwtDecode.mockReturnValue({ role: 'STUDENT' });

    await expect(createPostService('Subject', 'Content')).rejects.toThrow(
      'Unauthorized: Only admins and alumni can perform this action'
    );
  });

  it('throws fallback error message for recent posts failure', async () => {
    mockApi.get.mockRejectedValueOnce({
      response: { data: { message: 'Recent posts failed' } },
    } as never);

    await expect(getRecentPostsService(1, 5)).rejects.toThrow(
      'Failed to fetch recent posts'
    );
  });
});
