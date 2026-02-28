import { StrictMode, ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { render, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockGetProjectCounts,
  mockGetAllProjects,
  mockGetProjectsByUserId,
  mockGetSupportedProjects,
  mockGetFollowedProjects,
} = vi.hoisted(() => ({
  mockGetProjectCounts: vi.fn().mockResolvedValue(undefined),
  mockGetAllProjects: vi.fn().mockResolvedValue(undefined),
  mockGetProjectsByUserId: vi.fn().mockResolvedValue(undefined),
  mockGetSupportedProjects: vi.fn().mockResolvedValue(undefined),
  mockGetFollowedProjects: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  },
  AnimatePresence: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock('@mui/icons-material', () => ({
  Add: () => <span>add</span>,
}));

vi.mock('@/components/Project/ProjectFilter', () => ({
  default: () => <div data-testid="project-filter" />,
}));

vi.mock('@/components/Project/CreateProject', () => ({
  default: () => <div data-testid="create-project-modal" />,
}));

vi.mock('@/components/Project/CollaborationModal', () => ({
  default: () => <div data-testid="collaboration-modal" />,
}));

vi.mock('@/components/Project/ProjectDetailsCard', () => ({
  default: () => <div data-testid="project-details-modal" />,
}));

vi.mock('@/components/Project/ProjectGrid', () => ({
  default: () => <div data-testid="project-grid" />,
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'project-user-1' },
  }),
}));

vi.mock('@/contexts/ShowcaseContext', () => ({
  useShowcase: () => ({
    projectCounts: { total: 0, owned: 0, supported: 0, followed: 0 },
    allProjects: { data: [], pagination: { hasNext: false } },
    myProjects: { data: [], pagination: { hasNext: false } },
    supportedProjects: { data: [], pagination: { hasNext: false } },
    followedProjects: { data: [], pagination: { hasNext: false } },
    comments: {},
    projectById: null,
    loading: false,
    actionLoading: {
      refresh: false,
      count: false,
      projectDetails: new Set<string>(),
      comment: false,
      teamMembers: false,
    },
    seekingOptions: {},
    error: null,
    refreshProjects: vi.fn(),
    getProjectCounts: mockGetProjectCounts,
    getAllProjects: mockGetAllProjects,
    getProjectsByUserId: mockGetProjectsByUserId,
    getSupportedProjects: mockGetSupportedProjects,
    getFollowedProjects: mockGetFollowedProjects,
    getProjectById: vi.fn(),
    createProject: vi.fn(),
    deleteProject: vi.fn(),
    supportProject: vi.fn(),
    unsupportProject: vi.fn(),
    followProject: vi.fn(),
    unfollowProject: vi.fn(),
    requestCollaboration: vi.fn(),
    clearError: vi.fn(),
    getProjectUpdates: vi.fn(),
    getComments: vi.fn(),
    createComment: vi.fn(),
    getProjectTeamMembers: vi.fn(),
    removeProjectTeamMember: vi.fn(),
    createProjectTeamMember: vi.fn(),
    getSeekingOptions: vi.fn(),
  }),
}));

import ProjectMainPage from '@/pages/Project/ProjectMainPage';

describe('ProjectMainPage strict-mode behavior', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deduplicates initial project count and first tab fetch in StrictMode', async () => {
    render(
      <StrictMode>
        <MemoryRouter>
          <ProjectMainPage />
        </MemoryRouter>
      </StrictMode>
    );

    await waitFor(() => {
      expect(mockGetProjectCounts).toHaveBeenCalledTimes(1);
      expect(mockGetAllProjects).toHaveBeenCalledTimes(1);
    });
  });
});
