import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import React from 'react';
import { getErrorMessage } from '@/utils/errorHandler';

/**
 * Advanced: Testing Real Application Pages with Routes and Async Data
 */

// ============================================================================
// MOCK API SERVICE
// ============================================================================

const mockApiService = {
  fetchUserProfile: vi.fn(async (userId: string) => {
    await new Promise((resolve) => setTimeout(resolve, 100));
    return {
      id: userId,
      name: 'John Doe',
      email: 'john@example.com',
      role: 'student',
    };
  }),

  fetchUserConnections: vi.fn(async () => {
    await new Promise((resolve) => setTimeout(resolve, 100));
    return [
      { id: '1', name: 'Jane Smith', role: 'alumni' },
      { id: '2', name: 'Bob Johnson', role: 'student' },
    ];
  }),
};

// ============================================================================
// EXAMPLE PAGE WITH ASYNC DATA LOADING
// ============================================================================

interface ProfileData {
  id: string;
  name: string;
  email: string;
  role: string;
}

const ProfilePage: React.FC<{ userId: string }> = ({ userId }) => {
  const [profile, setProfile] = React.useState<ProfileData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        const data = await mockApiService.fetchUserProfile(userId);
        setProfile(data);
      } catch (err) {
        setError(getErrorMessage(err) + 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [userId]);

  if (loading) return <div role="status">Loading profile...</div>;
  if (error) return <div role="alert">{error}</div>;
  if (!profile) return <div>No profile found</div>;

  return (
    <div data-testid="profile-page">
      <h1>{profile.name}</h1>
      <p>Email: {profile.email}</p>
      <p>Role: {profile.role}</p>
    </div>
  );
};

describe('ProfilePage - Async Data Loading', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show loading state initially', () => {
    render(<ProfilePage userId="1" />);
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('Loading profile...')).toBeInTheDocument();
  });

  it('should load and display profile data', async () => {
    render(<ProfilePage userId="1" />);

    // Wait for profile data to load
    await waitFor(() => {
      expect(screen.getByTestId('profile-page')).toBeInTheDocument();
    });

    // Verify data is displayed
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Email: john@example.com')).toBeInTheDocument();
    expect(screen.getByText('Role: student')).toBeInTheDocument();
  });

  it('should display error message when fetch fails', async () => {
    mockApiService.fetchUserProfile.mockRejectedValueOnce(
      new Error('Network error')
    );

    render(<ProfilePage userId="1" />);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    expect(screen.getByText('Failed to load profile')).toBeInTheDocument();
  });

  it('should reload profile when userId changes', async () => {
    const { rerender } = render(<ProfilePage userId="1" />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Clear and update mock for new ID
    vi.clearAllMocks();
    mockApiService.fetchUserProfile.mockResolvedValueOnce({
      id: '2',
      name: 'Jane Smith',
      email: 'jane@example.com',
      role: 'alumni',
    });

    rerender(<ProfilePage userId="2" />);

    await waitFor(() => {
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });
  });
});

// ============================================================================
// PAGE WITH MULTIPLE SECTIONS LOADING
// ============================================================================

interface Connection {
  id: string;
  name: string;
  role: string;
}

interface ConnectionsPageProps {
  userId: string;
}

const ConnectionsPage: React.FC<ConnectionsPageProps> = ({ userId }) => {
  const [connections, setConnections] = React.useState<Connection[]>([]);
  const [profileLoading, setProfileLoading] = React.useState(true);
  const [connectionsLoading, setConnectionsLoading] = React.useState(true);

  React.useEffect(() => {
    // Simulate profile loading
    setTimeout(() => setProfileLoading(false), 100);
  }, []);

  React.useEffect(() => {
    const loadConnections = async () => {
      try {
        const data = await mockApiService.fetchUserConnections();
        setConnections(data);
      } finally {
        setConnectionsLoading(false);
      }
    };

    loadConnections();
  }, [userId]);

  return (
    <div data-testid="connections-page">
      <h1>My Connections</h1>

      {profileLoading && <div>Loading profile...</div>}
      {!profileLoading && <div>Profile loaded</div>}

      {connectionsLoading && <div role="status">Loading connections...</div>}
      {!connectionsLoading && (
        <div>
          <h2>Connections ({connections.length})</h2>
          <ul>
            {connections.map((conn) => (
              <li key={conn.id}>
                {conn.name} - {conn.role}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

describe('ConnectionsPage - Multiple Loading States', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render page structure while loading', () => {
    render(<ConnectionsPage userId="1" />);
    expect(screen.getByTestId('connections-page')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'My Connections' })
    ).toBeInTheDocument();
  });

  it('should show profile loading state', () => {
    render(<ConnectionsPage userId="1" />);
    expect(screen.getByText('Loading profile...')).toBeInTheDocument();
  });

  it('should load and display all sections', async () => {
    render(<ConnectionsPage userId="1" />);

    // Wait for profile to load
    await waitFor(() => {
      expect(screen.getByText('Profile loaded')).toBeInTheDocument();
    });

    // Wait for connections to load
    await waitFor(() => {
      expect(screen.getByText(/Connections \(2\)/)).toBeInTheDocument();
    });

    // Verify connections are displayed
    expect(screen.getByText('Jane Smith - alumni')).toBeInTheDocument();
    expect(screen.getByText('Bob Johnson - student')).toBeInTheDocument();
  });
});

// ============================================================================
// TESTING PAGE NAVIGATION AND ROUTING
// ============================================================================

const HomePage: React.FC = () => (
  <div>
    <h1>Home</h1>
    <a href="/profile/1">View Profile</a>
  </div>
);

const AppWithRoutes: React.FC = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/profile/:userId" element={<ProfilePage userId="1" />} />
    </Routes>
  </BrowserRouter>
);

describe('App Routing - Page Navigation', () => {
  it('should render home page initially', () => {
    render(<AppWithRoutes />);
    expect(screen.getByRole('heading', { name: 'Home' })).toBeInTheDocument();
  });

  it('should have navigation links', () => {
    render(<AppWithRoutes />);
    expect(
      screen.getByRole('link', { name: 'View Profile' })
    ).toBeInTheDocument();
  });
});

// ============================================================================
// TESTING PAGINATION/INFINITE SCROLL
// ============================================================================

interface PaginatedListProps {
  onLoadMore: () => Promise<void>;
}

const PaginatedList: React.FC<PaginatedListProps> = ({ onLoadMore }) => {
  const [items, setItems] = React.useState<string[]>(['Item 1', 'Item 2']);
  const [isLoading, setIsLoading] = React.useState(false);

  const handleLoadMore = async () => {
    setIsLoading(true);
    await onLoadMore();
    setItems((prev) => [...prev, `Item ${prev.length + 1}`]);
    setIsLoading(false);
  };

  return (
    <div data-testid="paginated-list">
      <ul>
        {items.map((item, idx) => (
          <li key={idx}>{item}</li>
        ))}
      </ul>
      <button onClick={handleLoadMore} disabled={isLoading}>
        {isLoading ? 'Loading more...' : 'Load More'}
      </button>
    </div>
  );
};

describe('PaginatedList - Load More Functionality', () => {
  it('should render initial items', () => {
    render(<PaginatedList onLoadMore={vi.fn()} />);
    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
  });

  it('should show loading state while fetching more', async () => {
    const mockLoadMore = vi.fn(
      async () => new Promise<void>((resolve) => setTimeout(resolve, 100))
    );

    render(<PaginatedList onLoadMore={mockLoadMore} />);

    const loadMoreBtn = screen.getByRole('button', { name: 'Load More' });
    await userEvent.click(loadMoreBtn);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Failed to load profile');
  });
});
