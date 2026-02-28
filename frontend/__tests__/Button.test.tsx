import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';

// Example component for testing
interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
}

const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  disabled = false,
  variant = 'primary',
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`btn btn-${variant}`}
  >
    {children}
  </button>
);

describe('Button Component', () => {
  it('renders button with text', () => {
    render(<Button>Click me</Button>);
    expect(
      screen.getByRole('button', { name: /click me/i })
    ).toBeInTheDocument();
  });

  it('calls onClick handler when clicked', async () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    const button = screen.getByRole('button', { name: /click me/i });
    await userEvent.click(button);

    expect(handleClick).toHaveBeenCalledOnce();
  });

  it('disables button when disabled prop is true', () => {
    render(<Button disabled>Disabled Button</Button>);
    expect(
      screen.getByRole('button', { name: /disabled button/i })
    ).toBeDisabled();
  });

  it('renders with correct variant class', () => {
    const { container } = render(
      <Button variant="secondary">Secondary</Button>
    );
    expect(container.querySelector('.btn-secondary')).toBeInTheDocument();
  });

  it('does not call onClick when disabled', async () => {
    const handleClick = vi.fn();
    render(
      <Button onClick={handleClick} disabled>
        Disabled
      </Button>
    );

    const button = screen.getByRole('button', { name: /disabled/i });
    await userEvent.click(button);

    expect(handleClick).not.toHaveBeenCalled();
  });
});
