import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ErrorBoundary } from 'react-error-boundary';
import {
  GlobalErrorFallback,
  RouteErrorFallback,
} from '@/components/ErrorBoundary/ErrorFallbacks';

const CrashingComponent = () => {
  throw new Error('Render crash');
};

describe('ErrorBoundary fallbacks', () => {
  it('renders global fallback with reload and dashboard actions', async () => {
    const onReload = vi.fn();

    render(
      <GlobalErrorFallback
        error={new Error('Global crash')}
        resetErrorBoundary={vi.fn()}
        onReload={onReload}
      />
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Reload Page' }));
    expect(onReload).toHaveBeenCalledTimes(1);

    expect(
      screen.getByRole('link', { name: 'Go to Dashboard' })
    ).toHaveAttribute('href', '/dashboard');
  });

  it('renders route fallback and allows retry', async () => {
    const resetErrorBoundary = vi.fn();

    render(
      <RouteErrorFallback
        error={new Error('Route crash')}
        resetErrorBoundary={resetErrorBoundary}
      />
    );

    expect(screen.getByText('This page failed to load')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Try Again' }));
    expect(resetErrorBoundary).toHaveBeenCalledTimes(1);
  });

  it('contains route crashes without breaking surrounding app shell', () => {
    render(
      <div>
        <span data-testid="app-shell">App Shell</span>
        <ErrorBoundary FallbackComponent={RouteErrorFallback}>
          <CrashingComponent />
        </ErrorBoundary>
      </div>
    );

    expect(screen.getByTestId('app-shell')).toBeInTheDocument();
    expect(screen.getByText('This page failed to load')).toBeInTheDocument();
  });
});
