import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import Dashboard from '@/pages/Dashboard';

type MockLayoutItem = {
  i: string;
};

type MockDashboardWidgetProps = {
  column: 'left' | 'right';
  layout: MockLayoutItem[];
  onDragStart: (column: 'left' | 'right', id: string) => void;
  onDrop: (column: 'left' | 'right', id: string) => void;
};

const mockNavigate = vi.fn();
const mockUseAuth = vi.fn();
const mockUseDashboardContext = vi.fn();
const mockUseNotification = vi.fn();
const mockUseEventContext = vi.fn();
const mockGetAllConversations = vi.fn();
const mockGetProfileCompletionStats = vi.fn();
const mockGetConnectionStats = vi.fn();
const mockFetchUpcoming = vi.fn();
const mockShowNotification = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('@/contexts/DashBoardContext', () => ({
  useDashboardContext: () => mockUseDashboardContext(),
}));

vi.mock('@/contexts/NotificationContext', () => ({
  useNotification: () => mockUseNotification(),
}));

vi.mock('@/contexts/eventContext', () => ({
  useEventContext: () => mockUseEventContext(),
}));

vi.mock('@/services/api', () => ({
  apiService: {
    messages: {
      getAllConversations: (...args: unknown[]) =>
        mockGetAllConversations(...args),
    },
  },
}));

vi.mock('@/services/websocket.improved', () => ({
  improvedWebSocketService: {
    connect: vi.fn().mockResolvedValue(undefined),
    on: vi.fn(),
    off: vi.fn(),
  },
}));

vi.mock('@/components/DashBoard/HeroWelcomeCard', () => ({
  default: () => <div data-testid="hero-card">hero</div>,
}));

vi.mock('@/components/Notification/NotificationIndicator', () => ({
  default: () => <div data-testid="notification-indicator">notification</div>,
}));

vi.mock('@/components/ThemeToggle', () => ({
  default: () => <div data-testid="theme-toggle">theme</div>,
}));

vi.mock('@/components/DashBoard/Components/StudentDashboardWidgets', () => ({
  studentWidgetTitles: {
    connection_stats: 'Connection Stats',
    message_activity: 'Message Activity',
    student_network_goal: 'Network Goal',
    student_activity_pulse: 'Activity Pulse',
    profile: 'Profile',
    recommended_connection: 'Recommended Connection',
    community: 'Community',
    referrals: 'Referrals',
    events: 'Events',
    leaderboard: 'Leaderboard',
    quick_actions: 'Quick Actions',
  },
  default: (props: MockDashboardWidgetProps) => (
    <div
      data-testid={`student-${props.column}`}
      data-layout={props.layout.map((item: MockLayoutItem) => item.i).join(',')}
    >
      {props.column === 'left' ? (
        <button
          data-testid="reorder-left"
          onClick={() => {
            props.onDragStart('left', 'community');
            props.onDrop('left', 'connection_stats');
          }}
        >
          reorder-left
        </button>
      ) : null}
    </div>
  ),
}));

vi.mock('@/components/DashBoard/Components/AlumniDashboardWidgets', () => ({
  alumniWidgetTitles: {
    connection_stats: 'Connection Stats',
    message_activity: 'Message Activity',
    profile: 'Profile',
    recommended_connection: 'Recommended Connection',
    community: 'Community',
    referrals: 'Referrals',
    events: 'Events',
    leaderboard: 'Leaderboard',
    quick_actions: 'Quick Actions',
    alumni_post_engagement: 'My Post Interaction',
    alumni_growth_goal: 'Growth Goal',
    alumni_influence: 'Influence Score',
  },
  default: (props: MockDashboardWidgetProps) => (
    <div
      data-testid={`alumni-${props.column}`}
      data-layout={props.layout.map((item: MockLayoutItem) => item.i).join(',')}
    />
  ),
}));

vi.mock('@/components/DashBoard/Components/AdminDashboardWidgets', () => ({
  adminWidgetTitles: {
    connection_stats: 'Connection Stats',
    message_activity: 'Message Activity',
    events: 'Events',
    leaderboard: 'Leaderboard',
    quick_actions: 'Quick Actions',
    admin_platform_health: 'Platform Health',
    admin_moderation_queue: 'Moderation Snapshot',
    admin_platform_totals: 'Platform Totals',
    admin_system_alerts: 'System Alerts',
  },
  default: (props: MockDashboardWidgetProps) => (
    <div
      data-testid={`admin-${props.column}`}
      data-layout={props.layout.map((item: MockLayoutItem) => item.i).join(',')}
    />
  ),
}));

describe('Dashboard widgets behavior', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();

    mockUseNotification.mockReturnValue({
      showNotification: mockShowNotification,
    });
    mockUseEventContext.mockReturnValue({
      fetchUpcoming: mockFetchUpcoming,
    });
    mockUseDashboardContext.mockReturnValue({
      connectionStats: { recent30Days: 0 },
      profileCompletionStats: { completionPercentage: 0 },
      getProfileCompletionStats: mockGetProfileCompletionStats,
      getConnectionStats: mockGetConnectionStats,
    });
    mockGetAllConversations.mockResolvedValue({ data: [] });
    mockGetProfileCompletionStats.mockResolvedValue(undefined);
    mockGetConnectionStats.mockResolvedValue(undefined);
    mockFetchUpcoming.mockResolvedValue(undefined);
  });

  it('restricts new users to starter widgets and keeps connection stats off', async () => {
    mockUseAuth.mockReturnValue({
      user: {
        id: 'u-new',
        role: 'STUDENT',
        profileCompleted: false,
        profile: { skills: [] },
      },
      token: 'token-new',
    });

    localStorage.setItem(
      'nexus:dashboard:columns:u-new:STUDENT',
      JSON.stringify({
        left: ['connection_stats', 'message_activity'],
        right: ['connection_stats'],
      })
    );

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByTestId('student-left')).toBeInTheDocument();
      expect(screen.getByTestId('student-right')).toBeInTheDocument();
    });

    expect(screen.getByTestId('student-left')).toHaveAttribute(
      'data-layout',
      'community,referrals'
    );
    expect(screen.getByTestId('student-right')).toHaveAttribute(
      'data-layout',
      'profile,recommended_connection,events,leaderboard'
    );

    fireEvent.click(
      screen.getByRole('button', { name: /view mode|edit mode/i })
    );
    fireEvent.click(screen.getByRole('button', { name: /manage blocks/i }));

    expect(screen.queryByText('Connection Stats')).not.toBeInTheDocument();
    expect(screen.queryByText('Message Activity')).not.toBeInTheDocument();
    expect(screen.getByText('Community')).toBeInTheDocument();
    expect(screen.getByText('Referrals')).toBeInTheDocument();
  });

  it('restricts new alumni users to starter widgets', async () => {
    mockUseAuth.mockReturnValue({
      user: {
        id: 'u-alum-new',
        role: 'ALUM',
        profileCompleted: false,
        profile: { skills: [] },
      },
      token: 'token-alum-new',
    });

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByTestId('alumni-left')).toBeInTheDocument();
      expect(screen.getByTestId('alumni-right')).toBeInTheDocument();
    });

    expect(screen.getByTestId('alumni-left')).toHaveAttribute(
      'data-layout',
      'community,referrals'
    );
    expect(screen.getByTestId('alumni-right')).toHaveAttribute(
      'data-layout',
      'profile,recommended_connection,events,leaderboard'
    );

    fireEvent.click(
      screen.getByRole('button', { name: /view mode|edit mode/i })
    );
    fireEvent.click(screen.getByRole('button', { name: /manage blocks/i }));

    expect(screen.queryByText('Connection Stats')).not.toBeInTheDocument();
    expect(screen.queryByText('Message Activity')).not.toBeInTheDocument();
    expect(screen.queryByText('My Post Interaction')).not.toBeInTheDocument();
    expect(screen.getByText('Community')).toBeInTheDocument();
    expect(screen.getByText('Referrals')).toBeInTheDocument();
  });

  it('persists same-column layout reorder to localStorage', async () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');

    mockUseAuth.mockReturnValue({
      user: {
        id: 'u-student',
        role: 'STUDENT',
        profileCompleted: true,
        profile: { skills: [] },
      },
      token: 'token-student',
    });

    localStorage.setItem(
      'nexus:dashboard:columns:u-student:STUDENT',
      JSON.stringify({
        left: [
          'connection_stats',
          'message_activity',
          'community',
          'referrals',
        ],
        right: [
          'profile',
          'recommended_connection',
          'events',
          'quick_actions',
          'leaderboard',
        ],
      })
    );

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByTestId('student-left')).toHaveAttribute(
        'data-layout',
        'connection_stats,message_activity,community,referrals,student_network_goal'
      );
    });

    fireEvent.click(
      screen.getByRole('button', { name: /view mode|edit mode/i })
    );
    fireEvent.click(screen.getByTestId('reorder-left'));

    await waitFor(() => {
      expect(screen.getByTestId('student-left')).toHaveAttribute(
        'data-layout',
        'community,connection_stats,message_activity,referrals,student_network_goal'
      );
    });

    const columnsKey = 'nexus:dashboard:columns:u-student:STUDENT';
    const columnWrites = setItemSpy.mock.calls.filter(
      ([key]) => key === columnsKey
    );
    expect(columnWrites.length).toBeGreaterThan(0);

    const latestPayload = JSON.parse(
      columnWrites[columnWrites.length - 1][1] as string
    ) as { left: string[]; right: string[] };

    expect(latestPayload.left).toEqual([
      'community',
      'connection_stats',
      'message_activity',
      'referrals',
      'student_network_goal',
    ]);
  });

  it('renders correct widget groups for alumni and admin presets', async () => {
    mockUseAuth.mockReturnValue({
      user: {
        id: 'u-alum',
        role: 'ALUM',
        profileCompleted: true,
        profile: { skills: [] },
      },
      token: 'token-alum',
    });

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByTestId('alumni-left')).toBeInTheDocument();
      expect(screen.getByTestId('alumni-right')).toBeInTheDocument();
    });

    cleanup();

    mockUseAuth.mockReturnValue({
      user: {
        id: 'u-admin',
        role: 'ADMIN',
        profileCompleted: true,
        profile: { skills: [] },
      },
      token: 'token-admin',
    });

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByTestId('admin-left')).toBeInTheDocument();
      expect(screen.getByTestId('admin-right')).toBeInTheDocument();
    });
  });
});
