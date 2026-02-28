import { StrictMode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { render, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockGetFeed,
  mockGetCommunityFeed,
  mockClearError,
  mockRefreshProfile,
} = vi.hoisted(() => ({
  mockGetFeed: vi.fn().mockResolvedValue(undefined),
  mockGetCommunityFeed: vi.fn().mockResolvedValue(undefined),
  mockClearError: vi.fn(),
  mockRefreshProfile: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/contexts/PostContext', () => ({
  usePosts: () => ({
    feed: [],
    communityFeed: [],
    getFeed: mockGetFeed,
    getCommunityFeed: mockGetCommunityFeed,
    pagination: { page: 1, hasNext: false },
    loading: false,
    error: null,
    clearError: mockClearError,
  }),
}));

vi.mock('@/contexts/ProfileContext', () => ({
  useProfile: () => ({
    profile: { id: 'profile-1' },
    refreshProfile: mockRefreshProfile,
  }),
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user-feed-1', role: 'ALUM' },
  }),
}));

vi.mock('@/components/News/RecentNews', () => ({
  default: () => <div data-testid="recent-news" />,
}));

vi.mock('@/components/Post/Post', () => ({
  Post: () => <div data-testid="post-item" />,
}));

import FeedPage from '@/pages/Posts/FeedPage';

describe('FeedPage strict-mode behavior', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deduplicates initial feed load and profile refresh in StrictMode', async () => {
    render(
      <StrictMode>
        <MemoryRouter>
          <FeedPage />
        </MemoryRouter>
      </StrictMode>
    );

    await waitFor(() => {
      expect(mockGetFeed).toHaveBeenCalledTimes(1);
      expect(mockRefreshProfile).toHaveBeenCalledTimes(1);
    });
  });
});
