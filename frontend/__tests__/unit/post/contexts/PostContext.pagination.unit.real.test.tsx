import { ReactNode } from 'react';
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockGetFeedService = vi.fn();

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user-1', role: 'ALUM', name: 'Tester' },
  }),
}));

vi.mock('@/services/PostService', () => ({
  createPostService: vi.fn(),
  getFeedService: (...args: unknown[]) => mockGetFeedService(...args),
  getCommunityFeedService: vi.fn(),
  getSubCommunityFeedService: vi.fn(),
  getPendingPostsService: vi.fn(),
  getPostByUserIdService: vi.fn(),
  getPostByIdService: vi.fn(),
  updatePostService: vi.fn(),
  approvePostService: vi.fn(),
  rejectPostService: vi.fn(),
  deletePostService: vi.fn(),
  searchPostsService: vi.fn(),
  getPostStatsService: vi.fn(),
  getPostCommentsService: vi.fn(),
  createCommentService: vi.fn(),
}));

import PostProvider, { usePosts } from '@/contexts/PostContext';

const wrapper = ({ children }: { children: ReactNode }) => (
  <PostProvider>{children}</PostProvider>
);

const makePost = (id: string) => ({
  id,
  authorId: `author-${id}`,
  subject: `subject-${id}`,
  content: `content-${id}`,
  type: 'GENERAL',
  status: 'APPROVED',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  author: {
    id: `author-${id}`,
    name: `Author ${id}`,
    role: 'ALUM',
    profile: { avatarUrl: '' },
  },
  _count: { Vote: 0, Comment: 0 },
});

describe('unit post: PostContext pagination append', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('appends load-more posts after existing feed and deduplicates by id', async () => {
    mockGetFeedService
      .mockResolvedValueOnce({
        posts: [makePost('p1'), makePost('p2')],
        pagination: {
          page: 1,
          limit: 10,
          total: 4,
          totalPages: 2,
          hasNext: true,
          hasPrev: false,
        },
      })
      .mockResolvedValueOnce({
        posts: [makePost('p3'), makePost('p2')],
        pagination: {
          page: 2,
          limit: 10,
          total: 4,
          totalPages: 2,
          hasNext: false,
          hasPrev: true,
        },
      });

    const { result } = renderHook(() => usePosts(), { wrapper });

    await act(async () => {
      await result.current.getFeed(1, 10, 'all');
    });

    await act(async () => {
      await result.current.getFeed(2, 10, 'all');
    });

    expect(result.current.feed.map((post) => post.id)).toEqual([
      'p1',
      'p2',
      'p3',
    ]);
    expect(result.current.pagination.page).toBe(2);
    expect(result.current.pagination.hasNext).toBe(false);
    expect(mockGetFeedService).toHaveBeenNthCalledWith(1, 1, 10, 'all');
    expect(mockGetFeedService).toHaveBeenNthCalledWith(2, 2, 10, 'all');
  });
});
