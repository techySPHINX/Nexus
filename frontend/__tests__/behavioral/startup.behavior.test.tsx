import { ReactNode } from 'react';
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/services/ShowcaseService', () => ({
  ShowcaseService: {
    getStartupStats: vi.fn(),
    getStartups: vi.fn(),
  },
}));

import StartupProvider, { useStartup } from '@/contexts/StartupContext';
import { ShowcaseService } from '@/services/ShowcaseService';

const mockedShowcaseService = vi.mocked(ShowcaseService, true);

const wrapper = ({ children }: { children: ReactNode }) => (
  <StartupProvider>{children}</StartupProvider>
);

describe('Startup domain behavior', () => {
  beforeEach(() => vi.clearAllMocks());

  it('maps startup stats and startup list into context state', async () => {
    mockedShowcaseService.getStartupStats.mockResolvedValueOnce({
      totalStartups: 5,
      myStartups: 2,
      followedStartups: 1,
    } as never);

    mockedShowcaseService.getStartups.mockResolvedValueOnce({
      data: [{ id: 's1', name: 'Alpha' }],
      pagination: { nextCursor: null, hasNext: false },
    } as never);

    const { result } = renderHook(() => useStartup(), { wrapper });

    await act(async () => {
      await result.current.getStartupStats();
      await result.current.getStartups({ pageSize: 12 }, false, true);
    });

    expect(result.current.stats.totalStartups).toBe(5);
    expect(result.current.all.data[0].name).toBe('Alpha');
  });
});
