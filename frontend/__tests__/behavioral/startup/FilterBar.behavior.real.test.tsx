import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import FilterBar from '@/components/Startup/FilterBar';

describe('behavior startup: FilterBar', () => {
  it('calls setSearch and setStatus when user updates filters', () => {
    const setSearch = vi.fn();
    const setStatus = vi.fn();

    render(
      <FilterBar
        search=""
        setSearch={setSearch}
        status="ALL"
        setStatus={setStatus}
      />
    );

    fireEvent.change(screen.getByPlaceholderText(/search startups/i), {
      target: { value: 'fintech' },
    });

    expect(setSearch).toHaveBeenCalledWith('fintech');
  });
});
