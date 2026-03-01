import { ComponentProps } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import AlumniDashboardWidgets from '@/components/DashBoard/Components/AlumniDashboardWidgets';

const mockGetPostByUserIdService = vi.fn();
const mockGetPostStatsService = vi.fn();

vi.mock('@/services/PostService', () => ({
  getPostByUserIdService: (...args: unknown[]) =>
    mockGetPostByUserIdService(...args),
  getPostStatsService: (...args: unknown[]) => mockGetPostStatsService(...args),
}));

vi.mock('@/components/DashBoard/Components/NetworkOverview', () => ({
  default: () => <div>network-overview</div>,
}));
vi.mock('@/components/DashBoard/Components/ProfileStrength', () => ({
  default: () => <div>profile-strength</div>,
}));
vi.mock('@/components/DashBoard/Components/RecommendedProjects', () => ({
  default: () => <div>recommended-projects</div>,
}));
vi.mock('@/components/DashBoard/Components/RecentPosts', () => ({
  default: () => <div>recent-posts</div>,
}));
vi.mock('@/components/DashBoard/Components/RecommendedConnection', () => ({
  default: () => <div>recommended-connection</div>,
}));
vi.mock('@/components/DashBoard/Components/UpcomingEvents', () => ({
  default: () => <div>upcoming-events</div>,
}));
vi.mock('@/components/DashBoard/Components/LeaderBoard', () => ({
  default: () => <div>leaderboard</div>,
}));

const createProps = (
  overrides: Partial<ComponentProps<typeof AlumniDashboardWidgets>> = {}
): ComponentProps<typeof AlumniDashboardWidgets> => ({
  layout: [
    {
      i: 'alumni_growth_goal',
      x: 0,
      y: 0,
      w: 12,
      h: 3,
    },
    {
      i: 'alumni_post_engagement',
      x: 0,
      y: 1,
      w: 12,
      h: 3,
    },
  ],
  column: 'left',
  isEditMode: true,
  widgets: {
    alumni_growth_goal: { visible: true },
    alumni_post_engagement: { visible: true },
  },
  userId: 'alumni-user',
  statsMessages: 3,
  statsPendingRequests: 1,
  statsConnectionsTotal: 75,
  statsRecentConnections: 8,
  onDragStart: vi.fn(),
  onDrop: vi.fn(),
  onNavigate: vi.fn(),
  ...overrides,
});

describe('AlumniDashboardWidgets', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    mockGetPostByUserIdService.mockResolvedValue({ posts: [] });
    mockGetPostStatsService.mockResolvedValue({ upvotes: 0, comments: 0 });
  });

  it('loads persisted growth goal for alumni', async () => {
    const storageKey = 'nexus:dashboard:alumni-growth-goal:alumni-user';
    window.localStorage.setItem(storageKey, '220');

    render(<AlumniDashboardWidgets {...createProps()} />);

    await waitFor(() => {
      expect(screen.getByText('Reach 220 connections')).toBeInTheDocument();
    });
    expect(screen.getByText('75/220')).toBeInTheDocument();
  });

  it('allows setting and persisting a new alumni growth goal', async () => {
    render(<AlumniDashboardWidgets {...createProps()} />);

    fireEvent.click(screen.getByRole('button', { name: /set goal/i }));
    fireEvent.change(screen.getByLabelText(/target connections/i), {
      target: { value: '260' },
    });
    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(screen.getByText('Reach 260 connections')).toBeInTheDocument();
    });

    const storageKey = 'nexus:dashboard:alumni-growth-goal:alumni-user';
    expect(window.localStorage.getItem(storageKey)).toBe('260');
  });

  it('keeps post engagement actions interactive', async () => {
    const onNavigate = vi.fn();
    render(<AlumniDashboardWidgets {...createProps({ onNavigate })} />);

    const openFeedButton = await screen.findByRole('button', {
      name: /open feed/i,
    });
    fireEvent.click(openFeedButton);

    expect(onNavigate).toHaveBeenCalledWith('/feed');
  });
});
