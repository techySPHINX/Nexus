import { ComponentProps } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import StudentDashboardWidgets from '@/components/DashBoard/Components/StudentDashboardWidgets';

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
  overrides: Partial<ComponentProps<typeof StudentDashboardWidgets>> = {}
): ComponentProps<typeof StudentDashboardWidgets> => ({
  layout: [
    {
      i: 'student_network_goal',
      x: 0,
      y: 0,
      w: 12,
      h: 3,
    },
  ],
  column: 'left',
  isEditMode: true,
  widgets: {
    student_network_goal: { visible: true },
  },
  userId: 'student-user',
  statsMessages: 5,
  statsPendingRequests: 2,
  statsConnectionsTotal: 40,
  statsRecentConnections: 7,
  onDragStart: vi.fn(),
  onDrop: vi.fn(),
  onNavigate: vi.fn(),
  ...overrides,
});

describe('StudentDashboardWidgets', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
  });

  it('loads persisted goal for the current student', async () => {
    const storageKey = 'nexus:dashboard:student-network-goal:student-user';
    window.localStorage.setItem(storageKey, '120');

    render(<StudentDashboardWidgets {...createProps()} />);

    await waitFor(() => {
      expect(screen.getByText('Reach 120 connections')).toBeInTheDocument();
    });
    expect(screen.getByText('40/120')).toBeInTheDocument();
  });

  it('allows setting and persisting a new network goal', async () => {
    render(<StudentDashboardWidgets {...createProps()} />);

    fireEvent.click(screen.getByRole('button', { name: /set goal/i }));
    fireEvent.change(screen.getByLabelText(/target connections/i), {
      target: { value: '180' },
    });
    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(screen.getByText('Reach 180 connections')).toBeInTheDocument();
    });

    const storageKey = 'nexus:dashboard:student-network-goal:student-user';
    expect(window.localStorage.getItem(storageKey)).toBe('180');
  });
});
