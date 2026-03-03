import { ReactNode } from 'react';
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user-1', role: 'STUDENT' },
  }),
}));

vi.mock('@/services/subCommunityService', () => ({
  subCommunityService: {
    getSubCommunityByType: vi.fn(),
  },
}));

import {
  SubCommunityProvider,
  useSubCommunity,
} from '@/contexts/SubCommunityContext';
import { subCommunityService } from '@/services/subCommunityService';

const mockedService = vi.mocked(subCommunityService, true);

const wrapper = ({ children }: { children: ReactNode }) => (
  <SubCommunityProvider>{children}</SubCommunityProvider>
);

describe('unit subcommunity: SubCommunityContext pagination metadata', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('exposes hasMoreForType and remaining count from cached page metadata', async () => {
    mockedService.getSubCommunityByType.mockResolvedValueOnce({
      data: [
        { id: 'c1', name: 'AI Hub', description: 'AI', type: 'Technology' },
        { id: 'c2', name: 'Web Guild', description: 'Web', type: 'Technology' },
      ],
      pagination: {
        page: 1,
        limit: 6,
        total: 8,
        totalPages: 2,
        hasNext: true,
        hasPrev: false,
      },
    } as never);

    const { result } = renderHook(() => useSubCommunity(), { wrapper });

    await act(async () => {
      await result.current.getSubCommunityByType('Technology', 1, 6);
    });

    expect(result.current.hasMoreForType('Technology', 6, '')).toBe(true);
    expect(result.current.getRemainingForType('Technology', 6, '')).toBe(6);
  });
});
