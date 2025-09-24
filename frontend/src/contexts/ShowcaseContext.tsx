import { ShowcaseService } from '@/services/ShowcaseService';
import {
  CollaborationRequestInterface,
  CollaborationStatus,
  CreateCollaborationRequestInterface,
  CreateProjectInterface,
  CreateProjectUpdateInterface,
  FilterProjectInterface,
  ProjectComment,
  ProjectDetailInterface,
  ProjectInterface,
  ProjectsPaginationResponse,
  ProjectTeam,
  ProjectUpdateInterface,
} from '@/types/ShowcaseType';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';

// Define the context type with all exposed functions
export interface ShowcaseContextType {
  //states
  projects: ProjectInterface[];
  pagination: ProjectsPaginationResponse;
  projectById: ProjectDetailInterface | null;
  projectByIdUpdates: ProjectUpdateInterface[];
  collaborationRequests: CollaborationRequestInterface[];
  loading: boolean;
  actionLoading: {
    support: Set<string>;
    follow: Set<string>;
    comment: Set<string>;
  };
  comments: Record<string, ProjectComment[]>;
  commentsPagination: ProjectsPaginationResponse;
  teamMembers: ProjectTeam[];
  error: string | null;
  clearError: () => void;

  //Actions
  createProject: (data: CreateProjectInterface) => Promise<void>;
  updateProject: (
    projectId: string,
    data: Partial<CreateProjectInterface>
  ) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  getAllProjects: (
    filterProjectDto?: FilterProjectInterface | undefined
  ) => Promise<void>;
  getProjectById: (projectId: string) => Promise<void>;
  getProjectForSharing: (
    projectId: string
  ) => Promise<ProjectDetailInterface | null>;
  createProjectUpdate: (
    projectId: string,
    data: CreateProjectUpdateInterface
  ) => Promise<void>;
  getProjectUpdates: (projectId: string) => Promise<void>;
  supportProject: (projectId: string) => Promise<void>;
  unsupportProject: (projectId: string) => Promise<void>;
  followProject: (projectId: string) => Promise<void>;
  unfollowProject: (projectId: string) => Promise<void>;
  requestCollaboration: (
    projectId: string,
    data: CreateCollaborationRequestInterface
  ) => Promise<void>;
  updateStatusCollaboration: (
    projectId: string,
    status: CollaborationStatus
  ) => Promise<void>;
  getCollaborationRequests: (projectId: string) => Promise<void>;
  createComment: (projectId: string, comment: string) => Promise<void>;
  getComments: (projectId: string) => Promise<void>;
  createProjectTeamMember: (
    projectId: string,
    data: ProjectTeam
  ) => Promise<void>;
  getProjectTeamMembers: (projectId: string) => Promise<void>;
  removeProjectTeamMember: (projectId: string, userId: string) => Promise<void>;
  clearProjectsCache: () => void;
}

const ShowcaseContext = React.createContext<ShowcaseContextType>({
  projects: [],
  pagination: {
    page: 1,
    pageSize: 15,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  },
  projectById: null,
  projectByIdUpdates: [],
  collaborationRequests: [],
  loading: false,
  actionLoading: {
    support: new Set<string>(),
    follow: new Set<string>(),
    comment: new Set<string>(),
  },
  comments: {},
  commentsPagination: {
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  },
  teamMembers: [],
  error: null,
  clearError: () => {},

  //actions
  createProject: async () => {},
  updateProject: async () => {},
  deleteProject: async () => {},
  getAllProjects: async () => {},
  getProjectById: async () => {},
  getProjectForSharing: async () => null,
  createProjectUpdate: async () => {},
  getProjectUpdates: async () => {},
  supportProject: async () => {},
  unsupportProject: async () => {},
  followProject: async () => {},
  unfollowProject: async () => {},
  requestCollaboration: async () => {},
  updateStatusCollaboration: async () => {},
  getCollaborationRequests: async () => {},
  createComment: async () => {},
  getComments: async () => {},
  createProjectTeamMember: async () => {},
  getProjectTeamMembers: async () => {},
  removeProjectTeamMember: async () => {},
  clearProjectsCache: () => {},
});

export const ShowcaseProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [actionLoading, setActionLoading] = useState({
    support: new Set<string>(),
    follow: new Set<string>(),
    comment: new Set<string>(),
  });
  const { user } = useAuth();
  const [projects, setProjects] = useState<ProjectInterface[]>([]);
  const [pagination, setPagination] = useState<ProjectsPaginationResponse>({
    page: 1,
    pageSize: 15,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });

  // Refs for pagination and loading
  const paginationRef = React.useRef(pagination);
  const loadingRef = React.useRef(loading);

  useEffect(() => {
    paginationRef.current = pagination;
    loadingRef.current = loading;
  }, [pagination, loading]);
  const [projectById, setProjectById] = useState<ProjectDetailInterface | null>(
    null
  );
  const [projectByIdUpdates, setProjectByIdUpdates] = useState<
    ProjectUpdateInterface[]
  >([]);
  const [collaborationRequests, setCollaborationRequests] = useState<
    CollaborationRequestInterface[]
  >([]);
  const [comments, setComments] = useState<Record<string, ProjectComment[]>>(
    {}
  );
  const [commentsPagination, setCommentsPagination] =
    useState<ProjectsPaginationResponse>({
      page: 1,
      pageSize: 10,
      total: 0,
      totalPages: 0,
      hasNext: false,
      hasPrev: false,
    });
  const [teamMembers, setTeamMembers] = useState<ProjectTeam[]>([]);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const createProject = useCallback(
    async (data: CreateProjectInterface) => {
      if (!user) {
        setError('User not authenticated');
        return;
      }
      setLoading(true);
      try {
        const response = await ShowcaseService.createProject(data);
        setProjects((prev) => [response, ...prev]);
      } catch (err) {
        setError(
          `Failed to create project: ${err instanceof Error ? err.message : String(err)}`
        );
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  const updateProject = useCallback(
    async (projectId: string, data: Partial<CreateProjectInterface>) => {
      if (!user) {
        setError('User not authenticated');
        return;
      }
      setLoading(true);
      try {
        const response = await ShowcaseService.updateProject(projectId, data);
        setProjects((prev) =>
          prev.map((project) =>
            project.id === projectId ? { ...project, ...response } : project
          )
        );
        // If the updated project is the one currently viewed, update it too
        if (projectById?.id === projectId) {
          setProjectById({ ...projectById, ...response });
        }
      } catch (err) {
        setError(
          `Failed to update project: ${err instanceof Error ? err.message : String(err)}`
        );
      } finally {
        setLoading(false);
      }
    },
    [user, projectById]
  );

  const deleteProject = useCallback(
    async (projectId: string) => {
      if (!user) {
        setError('User not authenticated');
        return;
      }
      setLoading(true);
      try {
        await ShowcaseService.deleteProject(projectId);
        setProjects((prev) =>
          prev.filter((project) => project.id !== projectId)
        );
        if (projectById?.id === projectId) {
          setProjectById(null);
        }
      } catch (err) {
        setError(
          `Failed to delete project: ${err instanceof Error ? err.message : String(err)}`
        );
      } finally {
        setLoading(false);
      }
    },
    [user, projectById]
  );

  const getAllProjects = useCallback(
    async (
      filterProjectDto?: FilterProjectInterface | undefined,
      loadMore: boolean = false
    ) => {
      if (!user) {
        setError('User not authenticated');
        return;
      }

      // Use refs for pagination and loading
      const currentPagination = paginationRef.current;
      const isLoading = loadingRef.current;
      if (loadMore && (isLoading || !currentPagination.hasNext)) {
        return;
      }

      setLoading(true);
      try {
        const response = await ShowcaseService.getAllProjects(filterProjectDto);

        if (loadMore) {
          setProjects((prev) => [...prev, ...response.data]);
        } else {
          setProjects(response.data);
        }
        setPagination(response.pagination);
      } catch (err) {
        setError(
          `Failed to get projects: ${err instanceof Error ? err.message : String(err)}`
        );
      } finally {
        setLoading(false);
      }
    },
    [user] // pagination and loading handled via refs
  );

  const getProjectById = useCallback(
    async (projectId: string) => {
      if (!user) {
        setError('User not authenticated');
        return;
      }

      setLoading(true);
      try {
        const existingProject = projects.find((proj) => proj.id === projectId);
        const details = await ShowcaseService.getProjectById(projectId);

        // Create properly typed object instead of casting
        const fullProject: ProjectDetailInterface = {
          ...(existingProject || {}),
          ...details,
          // Ensure required fields are present
          id: projectId,
          title: existingProject?.title || details.title || '',
          tags: existingProject?.tags || details.tags || [],
          status: existingProject?.status || details.status,
          createdAt: existingProject?.createdAt || details.createdAt,
          owner: existingProject?.owner || details.owner,
          _count: {
            supporters:
              existingProject?._count?.supporters ||
              details._count?.supporters ||
              0,
            followers:
              existingProject?._count?.followers ||
              details._count?.followers ||
              0,
            comments: details._count?.comments || 0,
            teamMembers: details._count?.teamMembers || 0,
            updates: details._count?.updates || 0,
          },
          seeking: details.seeking || [],
          skills: details.skills || [],
          description: details.description || '',
          teamMembers: details.teamMembers || [],
          updates: details.updates || [],
        };

        setProjectById(fullProject);
        setProjectByIdUpdates(details.updates || []);

        if (!existingProject) {
          setProjects((prev) => [fullProject, ...prev]);
        }
      } catch (err) {
        setError(
          `Failed to get project by ID: ${err instanceof Error ? err.message : String(err)}`
        );
      } finally {
        setLoading(false);
      }
    },
    [projects, user]
  );

  // Add project sharing function
  const getProjectForSharing = useCallback(
    async (projectId: string): Promise<ProjectDetailInterface | null> => {
      try {
        // First check if we have the project in context
        if (projectById?.id === projectId) {
          return projectById;
        }

        const existingProject = projects.find((p) => p.id === projectId);

        if (existingProject) {
          // We have basic info, try to get details
          try {
            const details = await ShowcaseService.getProjectById(projectId);
            return { ...existingProject, ...details } as ProjectDetailInterface;
          } catch (error) {
            // If details fetch fails, return at least the basic info
            setError(
              `Failed to get project by ID: ${error instanceof Error ? error.message : String(error)}`
            );
            return existingProject as ProjectDetailInterface;
          }
        }

        // If not in context, fetch the complete project
        return await ShowcaseService.getProjectById(projectId);
      } catch (error) {
        console.error('Failed to get project for sharing:', error);
        return null;
      }
    },
    [projectById, projects]
  );

  const createProjectUpdate = useCallback(
    async (projectId: string, data: CreateProjectUpdateInterface) => {
      if (!user) {
        setError('User not authenticated');
        return;
      }
      setLoading(true);
      try {
        const response = await ShowcaseService.createProjectUpdate(
          projectId,
          data
        );
        setProjectById((project) =>
          project
            ? {
                ...project,
                updates: project.updates
                  ? [...project.updates, response]
                  : [response],
              }
            : project
        );
        setProjectByIdUpdates((prev) => [...prev, response]);
      } catch (err) {
        setError(
          `Failed to create project update: ${err instanceof Error ? err.message : String(err)}`
        );
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  const getProjectUpdates = useCallback(
    async (projectId: string) => {
      if (!user) {
        setError('User not authenticated');
        return;
      }
      setLoading(true);
      try {
        const response = await ShowcaseService.getProjectUpdates(projectId);
        setProjectByIdUpdates(response);
      } catch (err) {
        setError(
          `Failed to get project updates: ${err instanceof Error ? err.message : String(err)}`
        );
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  const supportProject = useCallback(
    async (projectId: string) => {
      if (!user) {
        setError('User not authenticated');
        return;
      }
      setActionLoading((prev) => ({
        ...prev,
        support: new Set(prev.support).add(projectId),
      }));
      try {
        console.log('Supporting project ID:', projectId);
        await ShowcaseService.supportProject(projectId);
        // Optimistically update the supporters count and list
        setProjects((prev) => {
          return prev.map((proj) =>
            proj.id === projectId
              ? {
                  ...proj,
                  _count: {
                    ...proj._count,
                    supporters: (proj._count.supporters || 0) + 1,
                  },
                  supporters: Array.isArray(proj.supporters)
                    ? [...proj.supporters, { userId: user.id }]
                    : [{ userId: user.id }],
                }
              : proj
          );
        });

        if (projectById?.id === projectId) {
          setProjectById((prev) =>
            prev
              ? {
                  ...prev,
                  _count: {
                    ...prev._count,
                    supporters: (prev._count.supporters || 0) + 1,
                  },
                  supporters: Array.isArray(prev.supporters)
                    ? [...prev.supporters, { userId: user.id }]
                    : [{ userId: user.id }],
                }
              : prev
          );
        }
      } catch (err) {
        setError(
          `Failed to support project: ${err instanceof Error ? err.message : String(err)}`
        );
      } finally {
        setActionLoading((prev) => {
          const next = new Set(prev.support);
          next.delete(projectId);
          return { ...prev, support: next };
        });
      }
    },
    [projectById?.id, user]
  );

  const unsupportProject = useCallback(
    async (projectId: string) => {
      if (!user) {
        setError('User not authenticated');
        return;
      }
      setActionLoading((prev) => ({
        ...prev,
        support: new Set(prev.support).add(projectId),
      }));
      try {
        await ShowcaseService.unsupportProject(projectId);
        // Optimistically update the supporters count and list
        setProjects((prev) => {
          return prev.map((proj) =>
            proj.id === projectId
              ? {
                  ...proj,
                  _count: {
                    ...proj._count,
                    supporters: Math.max((proj._count.supporters || 1) - 1, 0),
                  },
                  supporters: proj.supporters
                    ? proj.supporters.filter((s) => s.userId !== user.id)
                    : [],
                }
              : proj
          );
        });

        if (projectById?.id === projectId) {
          setProjectById((prev) =>
            prev
              ? {
                  ...prev,
                  _count: {
                    ...prev._count,
                    supporters: Math.max((prev._count.supporters || 1) - 1, 0),
                  },
                  supporters: prev.supporters
                    ? prev.supporters.filter((s) => s.userId !== user.id)
                    : [],
                }
              : prev
          );
        }
      } catch (err) {
        setError(
          `Failed to unsupport project: ${err instanceof Error ? err.message : String(err)}`
        );
      } finally {
        setActionLoading((prev) => {
          const next = new Set(prev.support);
          next.delete(projectId);
          return { ...prev, support: next };
        });
      }
    },
    [user, projectById?.id]
  );

  const followProject = useCallback(
    async (projectId: string) => {
      if (!user) {
        setError('User not authenticated');
        return;
      }
      setActionLoading((prev) => ({
        ...prev,
        follow: new Set(prev.follow).add(projectId),
      }));
      try {
        await ShowcaseService.followProject(projectId);
        // optimistically update the followers count and list
        setProjects((prev) => {
          return prev.map((proj) =>
            proj.id === projectId
              ? {
                  ...proj,
                  _count: {
                    ...proj._count,
                    followers: (proj._count.followers || 0) + 1,
                  },
                  followers: Array.isArray(proj.followers)
                    ? [...proj.followers, { userId: user.id }]
                    : [{ userId: user.id }],
                }
              : proj
          );
        });

        if (projectById?.id === projectId) {
          setProjectById((prev) =>
            prev
              ? {
                  ...prev,
                  _count: {
                    ...prev._count,
                    followers: (prev._count.followers || 0) + 1,
                  },
                  followers: Array.isArray(prev.followers)
                    ? [...prev.followers, { userId: user.id }]
                    : [{ userId: user.id }],
                }
              : prev
          );
        }
      } catch (err) {
        setError(
          `Failed to follow project: ${err instanceof Error ? err.message : String(err)}`
        );
      } finally {
        setActionLoading((prev) => {
          const next = new Set(prev.follow);
          next.delete(projectId);
          return { ...prev, follow: next };
        });
      }
    },
    [user, projectById?.id]
  );

  const unfollowProject = useCallback(
    async (projectId: string) => {
      if (!user) {
        setError('User not authenticated');
        return;
      }
      setActionLoading((prev) => ({
        ...prev,
        follow: new Set(prev.follow).add(projectId),
      }));
      try {
        await ShowcaseService.unfollowProject(projectId);
        // Optimistically update the followers count and list
        setProjects((prev) => {
          return prev.map((proj) =>
            proj.id === projectId
              ? {
                  ...proj,
                  _count: {
                    ...proj._count,
                    followers: Math.max((proj._count.followers || 1) - 1, 0),
                  },
                  followers: proj.followers
                    ? proj.followers.filter((f) => f.userId !== user.id)
                    : [],
                }
              : proj
          );
        });

        if (projectById?.id === projectId) {
          setProjectById((prev) =>
            prev
              ? {
                  ...prev,
                  _count: {
                    ...prev._count,
                    followers: Math.max((prev._count.followers || 1) - 1, 0),
                  },
                  followers: prev.followers
                    ? prev.followers.filter((f) => f.userId !== user.id)
                    : [],
                }
              : prev
          );
        }
      } catch (err) {
        setError(
          `Failed to unfollow project: ${err instanceof Error ? err.message : String(err)}`
        );
      } finally {
        setActionLoading((prev) => {
          const next = new Set(prev.follow);
          next.delete(projectId);
          return { ...prev, follow: next };
        });
      }
    },
    [user, projectById?.id]
  );

  const requestCollaboration = useCallback(
    async (projectId: string, data: CreateCollaborationRequestInterface) => {
      if (!user) {
        setError('User not authenticated');
        return;
      }
      setLoading(true);
      try {
        await ShowcaseService.requestCollaboration(projectId, data);
      } catch (err) {
        setError(
          `Failed to request collaboration: ${err instanceof Error ? err.message : String(err)}`
        );
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  const getCollaborationRequests = useCallback(
    async (projectId: string) => {
      if (!user) {
        setError('User not authenticated');
        return;
      }
      setLoading(true);
      try {
        const response =
          await ShowcaseService.getCollaborationRequests(projectId);
        setCollaborationRequests(response);
      } catch (err) {
        setError(
          `Failed to get collaboration requests: ${err instanceof Error ? err.message : String(err)}`
        );
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  const updateStatusCollaboration = useCallback(
    async (projectId: string, status: CollaborationStatus) => {
      if (!user) {
        setError('User not authenticated');
        return;
      }
      setLoading(true);
      try {
        await ShowcaseService.updateStatusCollaboration(projectId, status);
        // Refresh collaboration requests
        await getCollaborationRequests(projectId);
      } catch (err) {
        setError(
          `Failed to update collaboration status: ${err instanceof Error ? err.message : String(err)}`
        );
      } finally {
        setLoading(false);
      }
    },
    [user, getCollaborationRequests]
  );

  const createComment = useCallback(
    async (projectId: string, comment: string) => {
      if (!user) {
        setError('User not authenticated');
        return;
      }
      setActionLoading((prev) => ({
        ...prev,
        comment: new Set(prev.comment).add(projectId),
      }));

      try {
        const response = await ShowcaseService.createComment(
          projectId,
          comment
        );

        setComments((prev) => ({
          ...prev,
          [projectId]: [response, ...(prev[projectId] ?? [])],
        }));
      } catch (err) {
        setError(
          `Failed to create comment: ${
            err instanceof Error ? err.message : String(err)
          }`
        );
      } finally {
        setActionLoading((prev) => {
          const next = new Set(prev.comment);
          next.delete(projectId);
          return { ...prev, comment: next };
        });
      }
    },
    [user]
  );

  const getComments = useCallback(
    async (projectId: string, page: number = 1) => {
      if (!user) {
        setError('User not authenticated');
        return;
      }
      setActionLoading((prev) => ({
        ...prev,
        comment: new Set(prev.comment).add(projectId),
      }));

      try {
        const response = await ShowcaseService.getComments(projectId, page);

        setComments((prev) => ({
          ...prev,
          [projectId]: [...(prev[projectId] ?? []), ...response.comments],
        }));

        setCommentsPagination((prev) => ({
          ...prev,
          [projectId]: response.pagination,
        }));
      } catch (err) {
        setError(
          `Failed to get project comments: ${
            err instanceof Error ? err.message : String(err)
          }`
        );
      } finally {
        setActionLoading((prev) => {
          const next = new Set(prev.comment);
          next.delete(projectId);
          return { ...prev, comment: next };
        });
      }
    },
    [user]
  );

  const createProjectTeamMember = useCallback(
    async (projectId: string, data: ProjectTeam) => {
      if (!user) {
        setError('User not authenticated');
        return;
      }
      setLoading(true);
      try {
        const response = await ShowcaseService.createProjectTeamMember(
          projectId,
          data
        );
        setTeamMembers((prev) => [...prev, response]);
      } catch (err) {
        setError(
          `Failed to create team member: ${err instanceof Error ? err.message : String(err)}`
        );
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  const getProjectTeamMembers = useCallback(
    async (projectId: string) => {
      if (!user) {
        setError('User not authenticated');
        return;
      }
      setLoading(true);
      try {
        const response = await ShowcaseService.getProjectTeamMembers(projectId);
        setTeamMembers(response);
      } catch (err) {
        setError(
          `Failed to get team members: ${err instanceof Error ? err.message : String(err)}`
        );
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  const removeProjectTeamMember = useCallback(
    async (projectId: string, userId: string) => {
      if (!user) {
        setError('User not authenticated');
        return;
      }
      setLoading(true);
      try {
        await ShowcaseService.removeProjectTeamMember(projectId, userId);
        setTeamMembers((prev) =>
          prev.filter((member) => member.userId !== userId)
        );
      } catch (err) {
        setError(
          `Failed to remove team member: ${err instanceof Error ? err.message : String(err)}`
        );
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  // Optional: Add cache clearing for when user logs out/changes
  const clearProjectsCache = useCallback(() => {
    setProjects([]);
    setProjectById(null);
    setPagination({
      page: 1,
      pageSize: 15,
      total: 0,
      totalPages: 0,
      hasNext: false,
      hasPrev: false,
    });
  }, []);

  // Add infinite scroll functionality
  // Add debounce to prevent multiple rapid calls
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          if (loadingRef.current || !paginationRef.current.hasNext) return;

          const scrollTop = document.documentElement.scrollTop;
          const scrollHeight = document.documentElement.scrollHeight;
          const clientHeight = document.documentElement.clientHeight;

          if (scrollTop + clientHeight >= scrollHeight - 100) {
            getAllProjects(
              {
                ...paginationRef.current,
                page: paginationRef.current.page + 1,
              },
              true
            );
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [getAllProjects]);

  const state: ShowcaseContextType = useMemo(
    () => ({
      projects,
      pagination,
      projectById,
      projectByIdUpdates,
      collaborationRequests,
      loading,
      actionLoading,
      error,
      comments,
      commentsPagination,
      teamMembers,
      clearError,

      //actions
      createProject,
      updateProject,
      deleteProject,
      getAllProjects,
      getProjectById,
      getProjectForSharing,
      createProjectUpdate,
      getProjectUpdates,
      supportProject,
      unsupportProject,
      followProject,
      unfollowProject,
      requestCollaboration,
      updateStatusCollaboration,
      getCollaborationRequests,
      createComment,
      getComments,
      createProjectTeamMember,
      getProjectTeamMembers,
      removeProjectTeamMember,
      clearProjectsCache,
    }),
    [
      projects,
      pagination,
      projectById,
      projectByIdUpdates,
      collaborationRequests,
      loading,
      actionLoading,
      error,
      comments,
      commentsPagination,
      teamMembers,
      clearError,
      createProject,
      updateProject,
      deleteProject,
      getAllProjects,
      getProjectById,
      getProjectForSharing,
      createProjectUpdate,
      getProjectUpdates,
      supportProject,
      unsupportProject,
      followProject,
      unfollowProject,
      requestCollaboration,
      updateStatusCollaboration,
      getCollaborationRequests,
      createComment,
      getComments,
      createProjectTeamMember,
      getProjectTeamMembers,
      removeProjectTeamMember,
      clearProjectsCache,
    ]
  );

  return (
    <ShowcaseContext.Provider value={state}>
      {children}
    </ShowcaseContext.Provider>
  );
};

export const useShowcase = (): ShowcaseContextType => {
  const context = React.useContext(ShowcaseContext);
  if (context === undefined) {
    throw new Error('useShowcase must be used within a ShowcaseProvider');
  }
  return context;
};

export default ShowcaseContext;
