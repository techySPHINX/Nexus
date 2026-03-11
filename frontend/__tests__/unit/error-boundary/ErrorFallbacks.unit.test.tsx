import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, afterEach } from 'vitest';
import { ErrorBoundary } from 'react-error-boundary';
import * as ErrorFallbacks from '@/components/ErrorBoundary/ErrorFallbacks';

describe('Error fallback components', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders global fallback with recovery actions', () => {
    render(
      <ErrorFallbacks.GlobalErrorFallback
        error={new Error('boom')}
        resetErrorBoundary={() => undefined}
      />
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Reload Page' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Go to Dashboard' })
    ).toHaveAttribute('href', '/dashboard');
  });

  it('triggers browser reload when reload button is clicked', async () => {
    const onReload = vi.fn();

    render(
      <ErrorFallbacks.GlobalErrorFallback
        error={new Error('boom')}
        resetErrorBoundary={() => undefined}
        onReload={onReload}
      />
    );

    await userEvent.click(screen.getByRole('button', { name: 'Reload Page' }));

    expect(onReload).toHaveBeenCalledTimes(1);
  });

  it('shows route fallback when child component throws', () => {
    const BrokenComponent = () => {
      throw new Error('route failure');
    };

    render(
      <ErrorBoundary FallbackComponent={ErrorFallbacks.RouteErrorFallback}>
        <BrokenComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText('This page failed to load')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Try Again' })
    ).toBeInTheDocument();
  });
});
