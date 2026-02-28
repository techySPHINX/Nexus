import { render, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const getStartupStats = vi.fn().mockResolvedValue(undefined);

vi.mock('@/contexts/StartupContext', () => ({
  useStartup: () => ({
    stats: { totalStartups: 0, myStartups: 0, followedStartups: 0 },
    all: { data: [], nextCursor: null, hasNext: false, loading: false },
    mine: { data: [], nextCursor: null, hasNext: false, loading: false },
    followed: { data: [], nextCursor: null, hasNext: false, loading: false },
    getStartupStats,
    getComments: vi.fn().mockResolvedValue({ comments: [] }),
    getStartups: vi.fn().mockResolvedValue(undefined),
    getMyStartups: vi.fn().mockResolvedValue(undefined),
    getFollowedStartups: vi.fn().mockResolvedValue(undefined),
    getStartupById: vi.fn().mockResolvedValue(null),
    followStartup: vi.fn().mockResolvedValue(undefined),
    unfollowStartup: vi.fn().mockResolvedValue(undefined),
    createComment: vi.fn().mockResolvedValue({}),
    createStartup: vi.fn().mockResolvedValue(undefined),
    updateStartup: vi.fn().mockResolvedValue(undefined),
    deleteStartup: vi.fn().mockResolvedValue(undefined),
    refreshTab: vi.fn().mockResolvedValue(undefined),
  }),
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'u1', role: 'ADMIN', name: 'Admin' } }),
}));

import StartupMainPage from '@/pages/Startup/StartupMainPage';

describe('behavior startup: StartupMainPage', () => {
  it('fetches startup stats on first render', async () => {
    render(<StartupMainPage />);

    await waitFor(() => {
      expect(getStartupStats).toHaveBeenCalledTimes(1);
    });
  });
});
