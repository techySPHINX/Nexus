import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { useState } from 'react';

/**
 * Complete Guide: Testing Components and Pages Load
 * This file demonstrates how to test if components and pages render correctly
 */

// ============================================================================
// 1. SIMPLE COMPONENT LOAD TEST
// ============================================================================

interface SimpleComponentProps {
  title: string;
  message?: string;
  onClick?: () => void;
}

const SimpleComponent: React.FC<SimpleComponentProps> = ({
  title,
  message = 'Default message',
  onClick,
}) => (
  <div>
    <h1>{title}</h1>
    <p>{message}</p>
    <button onClick={onClick}>Click me</button>
  </div>
);

describe('SimpleComponent - Load Tests', () => {
  // Test that component renders
  it('should render component', () => {
    render(<SimpleComponent title="Test Title" />);
    expect(
      screen.getByRole('heading', { name: 'Test Title' })
    ).toBeInTheDocument();
  });

  // Test that all elements load correctly
  it('should render all elements', () => {
    render(<SimpleComponent title="Test" message="Custom message" />);
    expect(screen.getByText('Custom message')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  // Test with default props
  it('should use default message when not provided', () => {
    render(<SimpleComponent title="Test" />);
    expect(screen.getByText('Default message')).toBeInTheDocument();
  });

  // Test conditional rendering
  it('should call onClick when button is clicked', async () => {
    const mockClick = vi.fn();
    render(<SimpleComponent title="Test" onClick={mockClick} />);

    await userEvent.click(screen.getByRole('button'));
    expect(mockClick).toHaveBeenCalled();
  });
});

// ============================================================================
// 2. COMPONENT WITH LOADING STATE
// ============================================================================

interface DataComponentProps {
  isLoading?: boolean;
  isError?: boolean;
  data?: { id: number; name: string }[];
}

const DataComponent: React.FC<DataComponentProps> = ({
  isLoading = false,
  isError = false,
  data = [],
}) => {
  if (isLoading) {
    return <div>Loading data...</div>;
  }

  if (isError) {
    return <div role="alert">Error loading data</div>;
  }

  if (data.length === 0) {
    return <div>No data available</div>;
  }

  return (
    <ul>
      {data.map((item) => (
        <li key={item.id}>{item.name}</li>
      ))}
    </ul>
  );
};

describe('DataComponent - Load States', () => {
  it('should show loading message while loading', () => {
    render(<DataComponent isLoading={true} />);
    expect(screen.getByText('Loading data...')).toBeInTheDocument();
  });

  it('should show error message when error occurs', () => {
    render(<DataComponent isError={true} />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Error loading data')).toBeInTheDocument();
  });

  it('should show empty state when no data', () => {
    render(<DataComponent data={[]} />);
    expect(screen.getByText('No data available')).toBeInTheDocument();
  });

  it('should display data when loaded successfully', () => {
    const mockData = [
      { id: 1, name: 'John Doe' },
      { id: 2, name: 'Jane Smith' },
    ];
    render(<DataComponent data={mockData} />);

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  it('should not show loading when data is loaded', () => {
    const mockData = [{ id: 1, name: 'User' }];
    render(<DataComponent data={mockData} />);
    expect(screen.queryByText('Loading data...')).not.toBeInTheDocument();
  });
});

// ============================================================================
// 3. PAGE COMPONENT WITH NAVIGATION
// ============================================================================

interface PageProps {
  title: string;
}

const PageWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

const DashboardPage: React.FC<PageProps> = ({ title }) => {
  const handleLogout = () => {
    // Simulate logout
    window.location.href = '/login';
  };

  return (
    <div>
      <header>
        <h1>{title}</h1>
        <button onClick={handleLogout}>Logout</button>
      </header>
      <main>
        <section>Dashboard Content</section>
      </main>
    </div>
  );
};

describe('DashboardPage - Page Load Tests', () => {
  it('should render page title', () => {
    render(
      <PageWrapper>
        <DashboardPage title="Dashboard" />
      </PageWrapper>
    );

    expect(
      screen.getByRole('heading', { name: 'Dashboard' })
    ).toBeInTheDocument();
  });

  it('should render all page sections', () => {
    render(
      <PageWrapper>
        <DashboardPage title="Dashboard" />
      </PageWrapper>
    );

    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByText('Dashboard Content')).toBeInTheDocument();
  });

  it('should have logout button', () => {
    render(
      <PageWrapper>
        <DashboardPage title="Dashboard" />
      </PageWrapper>
    );

    expect(screen.getByRole('button', { name: 'Logout' })).toBeInTheDocument();
  });
});

// ============================================================================
// 4. COMPONENT WITH FORM AND VALIDATION
// ============================================================================

interface LoginFormProps {
  onSubmit?: (email: string, password: string) => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onSubmit }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && password) {
      onSubmit?.(email, password);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        data-testid="email-input"
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        data-testid="password-input"
      />
      <button type="submit">Login</button>
    </form>
  );
};

describe('LoginForm - Component Load', () => {
  it('should render all form fields', () => {
    render(<LoginForm />);

    expect(screen.getByTestId('email-input')).toBeInTheDocument();
    expect(screen.getByTestId('password-input')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  it('should call onSubmit with form values', async () => {
    const mockSubmit = vi.fn();
    render(<LoginForm onSubmit={mockSubmit} />);

    const emailInput = screen.getByTestId('email-input');
    const passwordInput = screen.getByTestId('password-input');
    const submitButton = screen.getByRole('button', { name: /login/i });

    await userEvent.type(emailInput, 'user@example.com');
    await userEvent.type(passwordInput, 'password123');
    await userEvent.click(submitButton);

    expect(mockSubmit).toHaveBeenCalledWith('user@example.com', 'password123');
  });
});

// ============================================================================
// 5. COMPONENT WITH CONDITIONAL RENDERING
// ============================================================================

interface UserCardProps {
  user?: { id: number; name: string; role: string } | null;
  isAdmin?: boolean;
}

const UserCard: React.FC<UserCardProps> = ({ user, isAdmin = false }) => {
  if (!user) {
    return <div>No user selected</div>;
  }

  return (
    <div data-testid="user-card">
      <h2>{user.name}</h2>
      <p>Role: {user.role}</p>
      {isAdmin && <button>Edit User</button>}
    </div>
  );
};

describe('UserCard - Conditional Rendering', () => {
  it('should show message when no user', () => {
    render(<UserCard user={null} />);
    expect(screen.getByText('No user selected')).toBeInTheDocument();
    expect(screen.queryByTestId('user-card')).not.toBeInTheDocument();
  });

  it('should display user information when user exists', () => {
    const mockUser = { id: 1, name: 'John Doe', role: 'Student' };
    render(<UserCard user={mockUser} />);

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Role: Student')).toBeInTheDocument();
  });

  it('should show admin button when isAdmin is true', () => {
    const mockUser = { id: 1, name: 'Admin User', role: 'Admin' };
    render(<UserCard user={mockUser} isAdmin={true} />);

    expect(
      screen.getByRole('button', { name: 'Edit User' })
    ).toBeInTheDocument();
  });

  it('should not show admin button when isAdmin is false', () => {
    const mockUser = { id: 1, name: 'User', role: 'Student' };
    render(<UserCard user={mockUser} isAdmin={false} />);

    expect(
      screen.queryByRole('button', { name: 'Edit User' })
    ).not.toBeInTheDocument();
  });
});

// ============================================================================
// 6. CHECKING ACCESSIBILITY WHEN LOADING
// ============================================================================

const AccessibleLoadingComponent: React.FC<{ isLoading: boolean }> = ({
  isLoading,
}) => (
  <div>
    {isLoading && (
      <div role="status" aria-live="polite">
        Loading...
      </div>
    )}
    {!isLoading && <div>Content loaded</div>}
  </div>
);

describe('AccessibleLoadingComponent - Accessibility', () => {
  it('should have accessible loading indicator', () => {
    render(<AccessibleLoadingComponent isLoading={true} />);

    const loadingStatus = screen.getByRole('status');
    expect(loadingStatus).toHaveAttribute('aria-live', 'polite');
    expect(loadingStatus).toBeInTheDocument();
  });

  it('should replace loading with content', async () => {
    const { rerender } = render(
      <AccessibleLoadingComponent isLoading={true} />
    );
    expect(screen.getByText('Loading...')).toBeInTheDocument();

    rerender(<AccessibleLoadingComponent isLoading={false} />);
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    expect(screen.getByText('Content loaded')).toBeInTheDocument();
  });
});
