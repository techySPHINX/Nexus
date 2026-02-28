import { ReactNode } from 'react';
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'user-1' } }),
}));

vi.mock('@/services/ShowcaseService', () => ({
  ShowcaseService: {
    getAllProjects: vi.fn(),
    getProjectCounts: vi.fn(),
  },
}));

import ShowcaseProvider, { useShowcase } from '@/contexts/ShowcaseContext';
import { ShowcaseService } from '@/services/ShowcaseService';
import { status } from '@/types/ShowcaseType';

const mockedShowcaseService = vi.mocked(ShowcaseService, true);

const wrapper = ({ children }: { children: ReactNode }) => (
  <ShowcaseProvider>{children}</ShowcaseProvider>
);

const makeProject = () => ({
  id: 'project-1',
  title: 'Nexus Test Project',
  tags: ['web'],
  status: status.IN_PROGRESS,
  createdAt: new Date('2026-01-01'),
  owner: {
    id: 'owner-1',
    name: 'Owner',
    profile: {},
  },
  _count: {
    supporters: 0,
    followers: 0,
    collaborationRequests: 0,
  },
});

describe('ShowcaseContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads all projects and updates context state', async () => {
    mockedShowcaseService.getAllProjects.mockResolvedValueOnce({
      data: [makeProject()],
      pagination: { nextCursor: undefined, hasNext: false },
    } as never);

    const { result } = renderHook(() => useShowcase(), { wrapper });

    await act(async () => {
      await result.current.getAllProjects({ pageSize: 12 });
    });

    expect(mockedShowcaseService.getAllProjects).toHaveBeenCalledWith({
      pageSize: 12,
    });
    expect(result.current.allProjects.data).toHaveLength(1);
    expect(result.current.allProjects.data[0].id).toBe('project-1');
  });

  it('loads project counts and maps API fields to context fields', async () => {
    mockedShowcaseService.getProjectCounts.mockResolvedValueOnce({
      totalProjects: 8,
      myProjects: 3,
      supportedProjects: 2,
      followedProjects: 4,
    } as never);

    const { result } = renderHook(() => useShowcase(), { wrapper });

    await act(async () => {
      await result.current.getProjectCounts();
    });

    expect(result.current.projectCounts).toEqual({
      total: 8,
      owned: 3,
      supported: 2,
      followed: 4,
    });
  });
});
