import { useRef } from 'react';
import { render, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useOutsideClick } from '@/hooks/useOutsideClick';

function TestComponent({ onOutsideClick }: { onOutsideClick: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useOutsideClick(ref, () => onOutsideClick());

  return (
    <>
      <div ref={ref} data-testid="inside">
        Inside
      </div>
      <div data-testid="outside">Outside</div>
    </>
  );
}

describe('useOutsideClick', () => {
  it('calls callback when clicking outside target element', () => {
    const onOutsideClick = vi.fn();

    const { getByTestId } = render(
      <TestComponent onOutsideClick={onOutsideClick} />
    );

    fireEvent.mouseDown(getByTestId('outside'));

    expect(onOutsideClick).toHaveBeenCalledTimes(1);
  });

  it('does not call callback when clicking inside target element', () => {
    const onOutsideClick = vi.fn();

    const { getByTestId } = render(
      <TestComponent onOutsideClick={onOutsideClick} />
    );

    fireEvent.mouseDown(getByTestId('inside'));

    expect(onOutsideClick).not.toHaveBeenCalled();
  });
});
