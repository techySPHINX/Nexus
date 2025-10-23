import { ShowcaseService } from '@/services/ShowcaseService';
import {
  CollaborationRequestInterface,
  CollaborationStatus,
  CreateCollaborationRequestInterface,
  CreateProjectInterface,
  CreateProjectUpdateInterface,
  FilterProjectInterface,
  PaginatedProjectsInterface,
  ProjectComment,
  ProjectDetailInterface,
  ProjectPaginationResponse,
  ProjectTeam,
  ProjectUpdateInterface,
  Tags,
} from '@/types/ShowcaseType';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';

// Cache interfaces
interface ProjectCache {
  project: ProjectDetailInterface;
  lastFetched: number;
  updates: ProjectUpdateInterface[];
}

interface CommentsCache {
  comments: ProjectComment[];
  lastFetched: number;
  pagination: ProjectPaginationResponse;
}

// Cache configuration
const CACHE_CONFIG = {
  PROJECT_TTL: 5 * 60 * 1000, // 5 minutes
  COMMENTS_TTL: 3 * 60 * 1000, // 3 minutes
  MAX_CACHE_SIZE: 50, // Maximum number of items to cache
};

export interface ShowcaseContextType {
  // States
  projectCounts: {
    total: number;
    owned: number;
    supported: number;
    followed: number;
  };
  projects: PaginatedProjectsInterface;
  projectsByUserId: PaginatedProjectsInterface;
  supportedProjects: PaginatedProjectsInterface;
  followedProjects: PaginatedProjectsInterface;
  projectsCache: Map<string, ProjectCache>;
  projectById: ProjectDetailInterface | null;
  projectByIdUpdates: ProjectUpdateInterface[];
  collaborationRequests: CollaborationRequestInterface[];
  loading: boolean;
  actionLoading: {
    support: Set<string>;
    follow: Set<string>;
    comment: Set<string>;
    projectDetails: Set<string>;
  };
  comments: Record<string, ProjectComment[]>;
  commentsPagination: Record<string, ProjectPaginationResponse>;
  teamMembers: ProjectTeam[];
  error: string | null;
  clearError: () => void;

  // Cache info (for debugging/development)
  cacheInfo: {
    projects: number;
    comments: number;
  };

  allTypes: Tags[];
  typeLoading: boolean;

  // Actions
  createProject: (data: CreateProjectInterface) => Promise<void>;
  updateProject: (
    projectId: string,
    data: Partial<CreateProjectInterface>
  ) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  getProjectCounts: () => Promise<void>;
  getAllProjects: (
    filterProjectDto?: FilterProjectInterface | undefined,
    loadMore?: boolean
  ) => Promise<void>;
  getProjectById: (projectId: string, forceRefresh?: boolean) => Promise<void>;
  getProjectsByUserId: (
    ownerId?: string,
    filterProjectDto?: FilterProjectInterface | undefined,
    loadMore?: boolean
  ) => Promise<void>;
  getSupportedProjects: (
    filterProjectDto?: FilterProjectInterface | undefined,
    loadMore?: boolean
  ) => Promise<void>;
  getFollowedProjects: (
    filterProjectDto?: FilterProjectInterface | undefined,
    loadMore?: boolean
  ) => Promise<void>;
  getProjectForSharing: (
    projectId: string
  ) => Promise<ProjectDetailInterface | null>;
  createProjectUpdate: (
    projectId: string,
    data: CreateProjectUpdateInterface
  ) => Promise<void>;
  getProjectUpdates: (
    projectId: string,
    forceRefresh?: boolean
  ) => Promise<void>;
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
  getComments: (
    projectId: string,
    page?: number,
    forceRefresh?: boolean
  ) => Promise<void>;
  createProjectTeamMember: (
    projectId: string,
    data: ProjectTeam
  ) => Promise<void>;
  getProjectTeamMembers: (projectId: string) => Promise<void>;
  removeProjectTeamMember: (projectId: string, userId: string) => Promise<void>;
  clearProjectsCache: () => void;
  clearSpecificCache: (projectId: string) => void; // New method to clear specific cache
  fetchAllTypes: () => Promise<void>;
}

const ShowcaseContext = React.createContext<ShowcaseContextType>({
  // Initial states
  projectCounts: { total: 0, owned: 0, supported: 0, followed: 0 },
  projects: {
    data: [],
    pagination: { nextCursor: undefined, hasNext: false },
  },
  projectsByUserId: {
    data: [],
    pagination: { nextCursor: undefined, hasNext: false },
  },
  supportedProjects: {
    data: [],
    pagination: { nextCursor: undefined, hasNext: false },
  },
  followedProjects: {
    data: [],
    pagination: { nextCursor: undefined, hasNext: false },
  },
  projectsCache: new Map(),
  projectById: null,
  projectByIdUpdates: [],
  collaborationRequests: [],
  loading: false,
  actionLoading: {
    support: new Set<string>(),
    follow: new Set<string>(),
    comment: new Set<string>(),
    projectDetails: new Set<string>(),
  },
  comments: {},
  commentsPagination: {},
  cacheInfo: { projects: 0, comments: 0 },
  teamMembers: [],
  allTypes: [],
  error: null,
  typeLoading: false,
  clearError: () => {},
  clearSpecificCache: () => {},

  //actions
  createProject: async () => {},
  updateProject: async () => {},
  deleteProject: async () => {},
  getProjectCounts: async () => {},
  getAllProjects: async () => {},
  getProjectById: async () => {},
  getProjectsByUserId: async () => {},
  getSupportedProjects: async () => {},
  getFollowedProjects: async () => {},
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
  fetchAllTypes: async () => {},
});

export const ShowcaseProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [actionLoading, setActionLoading] = useState({
    support: new Set<string>(),
    follow: new Set<string>(),
    comment: new Set<string>(),
    projectDetails: new Set<string>(),
  });
  const { user } = useAuth();

  // States
  const [projectCounts, setProjectCounts] = useState<{
    total: number;
    owned: number;
    supported: number;
    followed: number;
  }>({
    total: 0,
    owned: 0,
    supported: 0,
    followed: 0,
  });
  const [projects, setProjects] = useState<PaginatedProjectsInterface>({
    data: [],
    pagination: {
      nextCursor: undefined,
      hasNext: false,
    },
  });
  const [projectsByUserId, setProjectsByUserId] =
    useState<PaginatedProjectsInterface>({
      data: [],
      pagination: {
        nextCursor: undefined,
        hasNext: false,
      },
    });
  const [supportedProjects, setSupportedProjects] =
    useState<PaginatedProjectsInterface>({
      data: [],
      pagination: {
        nextCursor: undefined,
        hasNext: false,
      },
    });
  const [followedProjects, setFollowedProjects] =
    useState<PaginatedProjectsInterface>({
      data: [],
      pagination: {
        nextCursor: undefined,
        hasNext: false,
      },
    });
  const [projectById, setProjectById] = useState<ProjectDetailInterface | null>(
    null
  );
  const [projectByIdUpdates, setProjectByIdUpdates] = useState<
    ProjectUpdateInterface[]
  >([]);
  const [collaborationRequests, setCollaborationRequests] = useState<
    CollaborationRequestInterface[]
  >([]);
  const [teamMembers, setTeamMembers] = useState<ProjectTeam[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Cache states
  const [projectsCache, setProjectsCache] = useState<Map<string, ProjectCache>>(
    new Map()
  );
  const [commentsCache, setCommentsCache] = useState<
    Map<string, CommentsCache>
  >(new Map());

  // Comments state (now backed by cache)
  const [comments, setComments] = useState<Record<string, ProjectComment[]>>(
    {}
  );
  const [commentsPagination, setCommentsPagination] = useState<
    Record<string, ProjectPaginationResponse>
  >({});

  const [allTypes, setAllTypes] = useState<Tags[]>([]);
  const [typeLoading, setTypeLoading] = useState<boolean>(false);

  // Refs for better performance
  const paginationRef = React.useRef(projects.pagination);
  const loadingRef = React.useRef(loading);
  const projectsCacheRef = React.useRef(projectsCache);
  const commentsCacheRef = React.useRef(commentsCache);

  useEffect(() => {
    paginationRef.current = projects.pagination;
    loadingRef.current = loading;
    projectsCacheRef.current = projectsCache;
    commentsCacheRef.current = commentsCache;
  }, [projects.pagination, loading, projectsCache, commentsCache]);

  // Cache management functions
  const getCachedProject = useCallback(
    (projectId: string): ProjectDetailInterface | null => {
      const cache = projectsCacheRef.current.get(projectId);
      if (!cache) return null;

      const isExpired =
        Date.now() - cache.lastFetched > CACHE_CONFIG.PROJECT_TTL;
      if (isExpired) {
        // Remove expired cache
        setProjectsCache((prev) => {
          const newCache = new Map(prev);
          newCache.delete(projectId);
          return newCache;
        });
        return null;
      }

      return cache.project;
    },
    []
  );

  const setCachedProject = useCallback(
    (
      projectId: string,
      project: ProjectDetailInterface,
      updates: ProjectUpdateInterface[] = []
    ) => {
      setProjectsCache((prev) => {
        const newCache = new Map(prev);

        // Enforce max cache size
        if (newCache.size >= CACHE_CONFIG.MAX_CACHE_SIZE) {
          // Remove oldest item (first one)
          const firstKey = newCache.keys().next().value;
          if (typeof firstKey === 'string') {
            newCache.delete(firstKey);
          }
        }

        newCache.set(projectId, { project, updates, lastFetched: Date.now() });
        return newCache;
      });
    },
    []
  );

  const getCachedComments = useCallback(
    (projectId: string): ProjectComment[] | null => {
      const cache = commentsCacheRef.current.get(projectId);
      if (!cache) return null;

      const isExpired =
        Date.now() - cache.lastFetched > CACHE_CONFIG.COMMENTS_TTL;
      if (isExpired) {
        setCommentsCache((prev) => {
          const newCache = new Map(prev);
          newCache.delete(projectId);
          return newCache;
        });
        return null;
      }

      return cache.comments;
    },
    []
  );

  const setCachedComments = useCallback(
    (
      projectId: string,
      comments: ProjectComment[],
      pagination: ProjectPaginationResponse
    ) => {
      setCommentsCache((prev) => {
        const newCache = new Map(prev);

        if (newCache.size >= CACHE_CONFIG.MAX_CACHE_SIZE) {
          // Remove the first (oldest) entry from Map
          const firstKey = newCache.keys().next().value;
          if (typeof firstKey === 'string') {
            newCache.delete(firstKey);
          }
        }

        // Add new entry (will be at the end)
        newCache.set(projectId, {
          comments,
          pagination,
          lastFetched: Date.now(),
        });
        return newCache;
      });
    },
    []
  );

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
        setProjects((prev) => ({
          data: [response, ...prev.data],
          pagination: response.pagination,
        }));
        setProjectCounts((prev) => ({
          ...prev,
          total: prev.total + 1,
          owned: prev.owned + 1,
        }));
        setProjectsByUserId((prev) => ({
          data: [response, ...prev.data],
          pagination: prev.pagination,
        }));
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

  // Enhanced project mutations - invalidate relevant caches
  const updateProject = useCallback(
    async (projectId: string, data: Partial<CreateProjectInterface>) => {
      if (!user) {
        setError('User not authenticated');
        return;
      }
      setLoading(true);
      try {
        const response = await ShowcaseService.updateProject(projectId, data);
        setProjects((prev) => ({
          ...prev,
          data: prev.data.map((project) =>
            project.id === projectId ? { ...project, ...response } : project
          ),
        }));

        // Update cache if exists
        if (projectsCacheRef.current.get(projectId)) {
          setCachedProject(projectId, {
            ...projectsCacheRef.current.get(projectId)?.project,
            ...response,
          });
        }

        if (projectById?.id === projectId) {
          setProjectById((prev) => (prev ? { ...prev, ...response } : prev));
        }
      } catch (err) {
        setError(
          `Failed to update project: ${err instanceof Error ? err.message : String(err)}`
        );
      } finally {
        setLoading(false);
      }
    },
    [user, projectById, setCachedProject]
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
        setProjects((prev) => ({
          ...prev,
          data: prev.data.filter((project) => project.id !== projectId),
        }));
        setProjectCounts((prev) => ({
          ...prev,
          total: prev.total - 1,
          owned: prev.owned - 1,
        }));
        setProjectsByUserId((prev) => ({
          ...prev,
          data: prev.data.filter((p) => p.id !== projectId),
          pagination: prev.pagination,
        }));
        // Clear cache for deleted project
        setProjectsCache((prev) => {
          const newCache = new Map(prev);
          newCache.delete(projectId);
          return newCache;
        });
        setCommentsCache((prev) => {
          const newCache = new Map(prev);
          newCache.delete(projectId);
          return newCache;
        });

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

  const getProjectCounts = useCallback(async () => {
    if (!user) {
      setError('User not authenticated');
      return;
    }

    setLoading(true);
    try {
      const counts = await ShowcaseService.getProjectCounts();
      setProjectCounts({
        total: counts.totalProjects || 0,
        owned: counts.myProjects || 0,
        supported: counts.supportedProjects || 0,
        followed: counts.followedProjects || 0,
      });
    } catch (err) {
      setError(
        `Failed to get project counts: ${err instanceof Error ? err.message : String(err)}`
      );
    } finally {
      setLoading(false);
    }
  }, [user]);

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

      if (!loadMore) setLoading(true);
      try {
        const response = await ShowcaseService.getAllProjects(filterProjectDto);

        if (loadMore) {
          setProjects((prev) => ({
            ...prev,
            data: [...prev.data, ...response.data],
            pagination: response.pagination,
          }));
        } else {
          setProjects({
            pagination: response.pagination,
            data: response.data,
          });
        }
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

  // Enhanced getProjectById with caching
  const getProjectById = useCallback(
    async (projectId: string, forceRefresh: boolean = false) => {
      if (!user) {
        setError('User not authenticated');
        return;
      }

      // Check cache first (unless force refresh)
      if (!forceRefresh) {
        const cachedProject = getCachedProject(projectId);
        if (cachedProject) {
          setProjectById(cachedProject);
          setProjectByIdUpdates(
            projectsCacheRef.current.get(projectId)?.updates || []
          );
          return;
        }
      }

      setActionLoading((prev) => ({
        ...prev,
        projectDetails: new Set(prev.projectDetails).add(projectId),
      }));
      try {
        const existingProject = projects.data.find(
          (proj) => proj.id === projectId
        );
        const details = await ShowcaseService.getProjectById(projectId);

        const fullProject: ProjectDetailInterface = {
          ...(existingProject || {}),
          ...details,
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

        console.log('Fetched project details:', fullProject);

        // Update cache
        setCachedProject(projectId, fullProject, details.updates || []);

        if (!existingProject) {
          setProjects((prev) => ({
            ...prev,
            data: [fullProject, ...prev.data],
          }));
        }
      } catch (err) {
        setError(
          `Failed to get project by ID: ${err instanceof Error ? err.message : String(err)}`
        );
      } finally {
        setActionLoading((prev) => {
          const next = new Set(prev.projectDetails);
          next.delete(projectId);
          return { ...prev, projectDetails: next };
        });
        // setLoading(false); --- IGNORE ---
      }
    },
    [projects, user, getCachedProject, setCachedProject]
  );

  const getProjectsByUserId = useCallback(
    async (
      ownerId?: string,
      filterProjectDto?: FilterProjectInterface,
      loadMore: boolean = false
    ) => {
      if (!user) {
        setError('User not authenticated');
        return;
      }

      const targetOwnerId = ownerId ?? user.id;

      // If not loading more and we already have data for the same owner, skip fetch
      if (
        !loadMore &&
        projectsByUserId.data.length > 0 &&
        projectsByUserId.data[0]?.owner?.id === targetOwnerId
      ) {
        return;
      }

      setLoading(true);
      try {
        if (targetOwnerId === user.id) {
          const response =
            await ShowcaseService.getMyProjects(filterProjectDto);
          if (loadMore) {
            setProjectsByUserId((prev) => ({
              data: [...prev.data, ...response.data],
              pagination: response.pagination,
            }));
          } else {
            setProjectsByUserId({
              data: response.data,
              pagination: response.pagination,
            });
          }
        } else {
          const response = await ShowcaseService.getProjectsByOwner(
            targetOwnerId,
            filterProjectDto
          );
          if (loadMore) {
            setProjectsByUserId((prev) => ({
              data: [...prev.data, ...response.data],
              pagination: response.pagination,
            }));
          } else {
            setProjectsByUserId({
              data: response.data,
              pagination: response.pagination,
            });
          }
        }
      } catch (err) {
        setError(
          `Failed to get my projects: ${err instanceof Error ? err.message : String(err)}`
        );
      } finally {
        setLoading(false);
      }
    },
    [user, projectsByUserId]
  );

  const getSupportedProjects = useCallback(
    async (
      filterProjectDto?: FilterProjectInterface,
      loadMore: boolean = false
    ) => {
      if (!user) {
        setError('User not authenticated');
        return;
      }

      // Skip fetch if not loading more and we already have data
      if (!loadMore && supportedProjects.data.length > 0) {
        return;
      }

      // If loading more but there's no next page, skip
      if (loadMore && !supportedProjects.pagination.hasNext) {
        return;
      }

      setLoading(true);
      try {
        const response =
          await ShowcaseService.getSupportedProjects(filterProjectDto);
        if (loadMore) {
          setSupportedProjects((prev: PaginatedProjectsInterface) => ({
            data: [
              ...prev.data,
              ...response.data.map((p: ProjectDetailInterface) => ({
                ...p,
                supporters: Array.isArray(p.supporters)
                  ? [...p.supporters, { userId: user.id }]
                  : [{ userId: user.id }],
              })),
            ],
            pagination: response.pagination,
          }));
        } else {
          setSupportedProjects({
            data: response.data.map((p: ProjectDetailInterface) => ({
              ...p,
              supporters: Array.isArray(p.supporters)
                ? [...p.supporters, { userId: user.id }]
                : [{ userId: user.id }],
            })),
            pagination: response.pagination,
          });
        }
      } catch (err) {
        setError(
          `Failed to get supported projects: ${err instanceof Error ? err.message : String(err)}`
        );
      } finally {
        setLoading(false);
      }
    },
    [user, supportedProjects]
  );

  const getFollowedProjects = useCallback(
    async (
      filterProjectDto?: FilterProjectInterface,
      loadMore: boolean = false
    ) => {
      if (!user) {
        setError('User not authenticated');
        return;
      }

      // Skip fetch if not loading more and we already have data
      if (!loadMore && followedProjects.data.length > 0) {
        return;
      }

      // If loading more but there's no next page, skip
      if (loadMore && !followedProjects.pagination.hasNext) {
        return;
      }

      setLoading(true);
      try {
        const response =
          await ShowcaseService.getFollowedProjects(filterProjectDto);
        if (loadMore) {
          setFollowedProjects((prev) => ({
            data: [
              ...prev.data,
              ...response.data.map((p: ProjectDetailInterface) => ({
                ...p,
                followers: Array.isArray(p.followers)
                  ? [...p.followers, { userId: user.id }]
                  : [{ userId: user.id }],
              })),
            ],
            pagination: response.pagination,
          }));
        } else {
          setFollowedProjects({
            data: response.data.map((p: ProjectDetailInterface) => ({
              ...p,
              followers: Array.isArray(p.followers)
                ? [...p.followers, { userId: user.id }]
                : [{ userId: user.id }],
            })),
            pagination: response.pagination,
          });
        }
      } catch (err) {
        setError(
          `Failed to get followed projects: ${err instanceof Error ? err.message : String(err)}`
        );
      } finally {
        setLoading(false);
      }
    },
    [user, followedProjects]
  );

  // Add project sharing function
  const getProjectForSharing = useCallback(
    async (projectId: string): Promise<ProjectDetailInterface | null> => {
      try {
        // First check if we have the project in context
        if (projectById?.id === projectId) {
          return projectById;
        }

        const existingProject = projects.data.find((p) => p.id === projectId);

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

  // Enhanced getProjectUpdates with caching
  const getProjectUpdates = useCallback(
    async (projectId: string, forceRefresh: boolean = false) => {
      if (!user) {
        setError('User not authenticated');
        return;
      }

      // Check cache first
      if (!forceRefresh && projectsCacheRef.current.get(projectId)?.updates) {
        const cache = projectsCacheRef.current.get(projectId);
        let isExpired = true;
        if (cache) {
          isExpired = Date.now() - cache.lastFetched > CACHE_CONFIG.PROJECT_TTL;
        }
        if (cache && !isExpired) {
          setProjectByIdUpdates(cache.updates);
          return;
        }
      }

      setLoading(true);
      try {
        const response = await ShowcaseService.getProjectUpdates(projectId);
        setProjectByIdUpdates(response);

        // Update cache
        if (projectsCacheRef.current.get(projectId)) {
          setProjectsCache((prev) => {
            const newCache = new Map(prev);
            const cacheItem = newCache.get(projectId);
            if (cacheItem) {
              cacheItem.updates = response;
              newCache.set(projectId, cacheItem);
            }
            return newCache;
          });
        }
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
        setProjects((prev) => ({
          ...prev,
          data: prev.data.map((proj) =>
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
          ),
        }));

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
        setProjectCounts((prev) => ({
          ...prev,
          supported: prev.supported + 1,
        }));
        // Find project from current projects list or from projectById and add it to supportedProjects
        const projToAdd =
          projects.data.find((p) => p.id === projectId) ||
          (projectById?.id === projectId ? projectById : null);

        if (projToAdd) {
          setSupportedProjects((prev) => ({
            data: [
              { ...projToAdd, supporters: [{ userId: user.id }] },
              ...prev.data.filter((p) => p.id !== projectId),
            ],
            pagination: prev.pagination,
          }));
        } else {
          // If not found locally, keep the existing supportedProjects state
          setSupportedProjects((prev) => ({
            data: prev.data,
            pagination: prev.pagination,
          }));
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
    [projectById, projects.data, user]
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
        setProjects((prev) => ({
          ...prev,
          data: prev.data.map((proj) =>
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
          ),
        }));

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
        setProjectCounts((prev) => ({
          ...prev,
          supported: Math.max(prev.supported - 1, 0),
        }));
        setSupportedProjects((prev) => ({
          data: prev.data.filter((p) => p.id !== projectId),
          pagination: prev.pagination,
        }));
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
        setProjects((prev) => ({
          ...prev,
          data: prev.data.map((proj) =>
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
          ),
        }));

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
        setProjectCounts((prev) => ({ ...prev, followed: prev.followed + 1 }));
        // Find project from current projects list or from projectById and add it to followedProjects
        const projToAdd =
          projects.data.find((p) => p.id === projectId) ||
          (projectById?.id === projectId ? projectById : null);

        if (projToAdd) {
          setFollowedProjects((prev) => ({
<<<<<<< HEAD
<<<<<<< HEAD
=======
>>>>>>> eaf5b80 (state variable fix)
            data: [
              { ...projToAdd, followers: [{ userId: user.id }] },
              ...prev.data.filter((p) => p.id !== projectId),
            ],
<<<<<<< HEAD
=======
            data: [projToAdd, ...prev.data.filter((p) => p.id !== projectId)],
>>>>>>> a2802a3 (Performance upgrade- lazy Loading)
=======
>>>>>>> eaf5b80 (state variable fix)
            pagination: prev.pagination,
          }));
        } else {
          // If not found locally, keep the existing followedProjects state
          setFollowedProjects((prev) => ({
            data: prev.data,
            pagination: prev.pagination,
          }));
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
    [user, projectById, projects.data]
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
        setProjects((prev) => ({
          ...prev,
          data: prev.data.map((proj) =>
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
          ),
        }));

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
        setProjectCounts((prev) => ({
          ...prev,
          followed: Math.max(prev.followed - 1, 0),
        }));
        setFollowedProjects((prev) => ({
          data: prev.data.filter((p) => p.id !== projectId),
          pagination: prev.pagination,
        }));
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

  // Enhanced createComment - invalidate cache
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

        // Invalidate comments cache for this project
        setCommentsCache((prev) => {
          const newCache = new Map(prev);
          newCache.delete(projectId);
          return newCache;
        });
      } catch (err) {
        setError(
          `Failed to create comment: ${err instanceof Error ? err.message : String(err)}`
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

  // Enhanced getComments with caching
  const getComments = useCallback(
    async (
      projectId: string,
      page: number = 1,
      forceRefresh: boolean = false
    ) => {
      if (!user) {
        setError('User not authenticated');
        return;
      }

      // Check cache first (unless force refresh or loading more pages)
      if (!forceRefresh && page === 1) {
        const cachedComments = getCachedComments(projectId);
        if (cachedComments) {
          setComments((prev) => ({ ...prev, [projectId]: cachedComments }));
          setCommentsPagination((prev) => ({
            ...prev,
            [projectId]: commentsCacheRef.current.get(projectId)
              ?.pagination || {
              page: 1,
              pageSize: 10,
              total: 0,
              totalPages: 0,
              hasNext: false,
              hasPrev: false,
            },
          }));
          return;
        }
      }

      setActionLoading((prev) => ({
        ...prev,
        comment: new Set(prev.comment).add(projectId),
      }));

      try {
        const response = await ShowcaseService.getComments(projectId, page);

        if (page === 1) {
          // First page - replace comments
          setComments((prev) => ({
            ...prev,
            [projectId]: response.comments,
          }));
          // Cache first page results
          setCachedComments(projectId, response.comments, response.pagination);
        } else {
          // Subsequent pages - append comments
          setComments((prev) => ({
            ...prev,
            [projectId]: [...(prev[projectId] ?? []), ...response.comments],
          }));
        }

        setCommentsPagination((prev) => ({
          ...prev,
          [projectId]: response.pagination,
        }));
      } catch (err) {
        setError(
          `Failed to get project comments: ${err instanceof Error ? err.message : String(err)}`
        );
      } finally {
        setActionLoading((prev) => {
          const next = new Set(prev.comment);
          next.delete(projectId);
          return { ...prev, comment: next };
        });
      }
    },
    [user, getCachedComments, setCachedComments]
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

  const [typesLastFetched, setTypesLastFetched] = useState<number>(0);

  const fetchAllTypes = useCallback(async (): Promise<void> => {
    if (Date.now() - typesLastFetched < 10 * 60 * 1000) {
      return; // Skip fetching if last fetched within 10 minutes
    }
    setTypeLoading(true);
    try {
      console.log('Fetching project types from API...');
      const types = await ShowcaseService.getAllProjectTypes();
      setAllTypes(types);
      setTypesLastFetched(Date.now());
    } catch (err) {
      console.error('Failed to fetch project types:', err);
    } finally {
      setTypeLoading(false);
    }
  }, [typesLastFetched]);

  // New method to clear specific project cache
  const clearSpecificCache = useCallback((projectId: string) => {
    setProjectsCache((prev) => {
      const newCache = { ...prev };
      newCache.delete(projectId);
      return newCache;
    });
    setCommentsCache((prev) => {
      const newCache = new Map(prev);
      newCache.delete(projectId);
      return newCache;
    });
  }, []);

  const clearProjectsCache = useCallback(() => {
    setProjects({
      data: [],
      pagination: {
        nextCursor: undefined,
        hasNext: false,
      },
    });
    setProjectById(null);
    setProjectsCache(new Map());
    setCommentsCache(new Map());
  }, []);

  // Cache info for debugging
  const cacheInfo = useMemo(
    () => ({
      projects: Object.keys(projectsCache).length,
      comments: Object.keys(commentsCache).length,
    }),
    [projectsCache, commentsCache]
  );

  // Add infinite scroll functionality
  // Add debounce to prevent multiple rapid calls
  // useEffect(() => {
  //   let ticking = false;

  //   const handleScroll = () => {
  //     if (!ticking) {
  //       requestAnimationFrame(() => {
  //         if (loadingRef.current || !paginationRef.current.hasNext) return;

  //         const scrollTop = document.documentElement.scrollTop;
  //         const scrollHeight = document.documentElement.scrollHeight;
  //         const clientHeight = document.documentElement.clientHeight;

  //         if (scrollTop + clientHeight >= scrollHeight - 100) {
  //           getAllProjects(
  //             {
  //               ...paginationRef.current,
  //               page: paginationRef.current.page + 1,
  //             },
  //             true
  //           );
  //         }
  //         ticking = false;
  //       });
  //       ticking = true;
  //     }
  //   };

  //   window.addEventListener('scroll', handleScroll, { passive: true });
  //   return () => window.removeEventListener('scroll', handleScroll);
  // }, [getAllProjects]);

  const state: ShowcaseContextType = useMemo(
    () => ({
      projectCounts,
      projects,
      projectsByUserId,
      supportedProjects,
      followedProjects,
      projectsCache,
      projectById,
      projectByIdUpdates,
      collaborationRequests,
      loading,
      actionLoading,
      error,
      comments,
      commentsPagination,
      teamMembers,
      cacheInfo,
      allTypes,
      typeLoading,

      // Cache management
      clearError,
      clearSpecificCache,

      // Actions (include all the existing ones)
      createProject,
      updateProject,
      deleteProject,
      getProjectCounts,
      getAllProjects,
      getProjectById,
      getProjectsByUserId,
      getSupportedProjects,
      getFollowedProjects,
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
      fetchAllTypes,
    }),
    [
      projectCounts,
      projects,
      projectsByUserId,
      supportedProjects,
      followedProjects,
      projectsCache,
      projectById,
      projectByIdUpdates,
      collaborationRequests,
      loading,
      actionLoading,
      cacheInfo,
      error,
      comments,
      commentsPagination,
      teamMembers,
      allTypes,
      typeLoading,
      clearError,
      createProject,
      updateProject,
      deleteProject,
      getProjectCounts,
      getAllProjects,
      getProjectById,
      getProjectsByUserId,
      getSupportedProjects,
      getFollowedProjects,
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
      clearSpecificCache,
      fetchAllTypes,
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
