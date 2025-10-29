import { ShowcaseService } from '@/services/ShowcaseService';
import {
  CollaborationRequestInterface,
  CollaborationStatus,
  CommentPaginationResponse,
  CreateCollaborationRequestInterface,
  CreateProjectInterface,
  CreateProjectUpdateInterface,
  FilterProjectInterface,
  PaginatedProjectsInterface,
  ProjectComment,
  ProjectDetailInterface,
  ProjectTeam,
  ProjectUpdateInterface,
  Tags,
} from '@/types/ShowcaseType';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { saveSmallList, restoreSmallList } from './showcasePersistence';
import { useAuth } from './AuthContext';
import { getErrorMessage } from '@/utils/errorHandler';

// Cache interfaces
interface ProjectCache {
  project: ProjectDetailInterface;
  lastFetched: number;
  updates: ProjectUpdateInterface[];
}

interface CommentsCache {
  comments: ProjectComment[];
  lastFetched: number;
  pagination: CommentPaginationResponse;
}

// Cache configuration
const CACHE_CONFIG = {
  PROJECT_TTL: 5 * 60 * 1000, // 5 minutes
  COMMENTS_TTL: 3 * 60 * 1000, // 3 minutes
  MAX_CACHE_SIZE: 50, // Maximum number of items to cache
};

// Persistence keys & config
const SHOWCASE_ALLPROJECTS_KEY = 'showcase:allProjects:v1';
const SHOWCASE_SUPPORTED_KEY = 'showcase:supportedProjects:v1';
const SHOWCASE_FOLLOWED_KEY = 'showcase:followedProjects:v1';
const SHOWCASE_MYPROJECTS_KEY = 'showcase:myProjects:v1';
const PERSIST_DEBOUNCE_MS = 500; // debounce writes to IndexedDB

export interface ShowcaseContextType {
  // States
  projectCounts: {
    total: number;
    owned: number;
    supported: number;
    followed: number;
  };
  allProjects: PaginatedProjectsInterface;
  // projects: ProjectInterface[];
  projectsByUserId: PaginatedProjectsInterface;
  supportedProjects: PaginatedProjectsInterface;
  followedProjects: PaginatedProjectsInterface;
  projectsCache: Map<string, ProjectCache>;
  projectById: ProjectDetailInterface | null;
  projectByIdUpdates: ProjectUpdateInterface[];
  collaborationRequests: CollaborationRequestInterface[];
  loading: boolean;
  actionLoading: {
    teamMembers: boolean;
    refresh: boolean;
    count: boolean;
    support: Set<string>;
    follow: Set<string>;
    comment: boolean;
    projectDetails: Set<string>;
  };
  comments: Record<
    string,
    {
      data: ProjectComment[];
      pagination: CommentPaginationResponse;
    }
  >;
  teamMembers: Record<string, ProjectTeam[]>;
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
  refreshProjects: (tab: number) => Promise<void>;
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
  getProjectById: (
    projectId: string,
    forceRefresh?: boolean,
    tab?: number
  ) => Promise<void>;
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
  allProjects: {
    data: [],
    pagination: { nextCursor: undefined, hasNext: false },
  },
  // projects: [],
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
    teamMembers: false,
    refresh: false,
    count: false,
    support: new Set<string>(),
    follow: new Set<string>(),
    comment: false,
    projectDetails: new Set<string>(),
  },
  comments: {},
  cacheInfo: { projects: 0, comments: 0 },
  teamMembers: {},
  allTypes: [],
  error: null,
  typeLoading: false,
  clearError: () => {},
  clearSpecificCache: () => {},

  //actions
  refreshProjects: async () => {},
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
    teamMembers: false,
    refresh: false,
    count: false,
    support: new Set<string>(),
    follow: new Set<string>(),
    comment: false,
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
  // const [projects, setProjects] = useState<ProjectInterface[]>([]);
  const [allProjects, setAllProjects] = useState<PaginatedProjectsInterface>({
    data: [],
    pagination: { nextCursor: undefined, hasNext: false },
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
  const [teamMembers, setTeamMembers] = useState<Record<string, ProjectTeam[]>>(
    {}
  );
  const [error, setError] = useState<string | null>(null);

  // Cache states
  const [projectsCache, setProjectsCache] = useState<Map<string, ProjectCache>>(
    new Map()
  );
  const [commentsCache, setCommentsCache] = useState<
    Map<string, CommentsCache>
  >(new Map());

  // Comments state (now backed by cache)
  const [comments, setComments] = useState<
    Record<
      string,
      {
        data: ProjectComment[];
        pagination: CommentPaginationResponse;
      }
    >
  >({});

  const [allTypes, setAllTypes] = useState<Tags[]>([]);
  const [typeLoading, setTypeLoading] = useState<boolean>(false);

  // Refs for better performance
  const paginationRef = React.useRef(allProjects.pagination);
  const loadingRef = React.useRef(loading);
  const projectsCacheRef = React.useRef(projectsCache);
  const commentsCacheRef = React.useRef(commentsCache);
  const rehydrateResolveRef = React.useRef<(() => void) | null>(null);
  const rehydratePromiseRef = React.useRef<Promise<void>>(
    new Promise((res) => {
      rehydrateResolveRef.current = res;
    })
  );

  useEffect(() => {
    paginationRef.current = allProjects.pagination;
    loadingRef.current = loading;
    projectsCacheRef.current = projectsCache;
    commentsCacheRef.current = commentsCache;
  }, [allProjects.pagination, loading, projectsCache, commentsCache]);

  // Restore small persisted lists (index-only) on mount
  useEffect(() => {
    let mounted = true;

    const restore = async () => {
      try {
        const p = await restoreSmallList(SHOWCASE_ALLPROJECTS_KEY);
        if (mounted && p) setAllProjects(p);

        const sup = await restoreSmallList(SHOWCASE_SUPPORTED_KEY);
        if (mounted && sup) setSupportedProjects(sup);

        const fol = await restoreSmallList(SHOWCASE_FOLLOWED_KEY);
        if (mounted && fol) setFollowedProjects(fol);

        const my = await restoreSmallList(SHOWCASE_MYPROJECTS_KEY);
        if (mounted && my) setProjectsByUserId(my);

        // mark rehydration complete so callers can wait briefly for caches
        if (rehydrateResolveRef.current) rehydrateResolveRef.current();
      } catch (err) {
        console.error('Failed to restore showcase small lists', err);
      }
    };

    restore();

    return () => {
      mounted = false;
    };
  }, []);

  // Persist small lists (index-only) to IndexedDB (debounced)
  useEffect(() => {
    let t: number | null = null;
    if (t) window.clearTimeout(t);
    t = window.setTimeout(() => {
      try {
        saveSmallList(SHOWCASE_ALLPROJECTS_KEY, allProjects);
        saveSmallList(SHOWCASE_SUPPORTED_KEY, supportedProjects);
        saveSmallList(SHOWCASE_FOLLOWED_KEY, followedProjects);
        saveSmallList(SHOWCASE_MYPROJECTS_KEY, projectsByUserId);
      } catch (err) {
        console.error('Failed to persist small lists', err);
      }
      if (t) {
        window.clearTimeout(t);
        t = null;
      }
    }, PERSIST_DEBOUNCE_MS);

    return () => {
      if (t) window.clearTimeout(t);
    };
  }, [allProjects, supportedProjects, followedProjects, projectsByUserId]);

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

  const getCachedComments = useCallback((projectId: string) => {
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

    return cache;
  }, []);

  const setCachedComments = useCallback(
    (
      projectId: string,
      comments: ProjectComment[],
      pagination: CommentPaginationResponse
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
        // setProjects((prev) => [response, ...prev]);
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
        // setProjects((prev) =>
        //   prev.map((project) =>
        //     project.id === projectId ? { ...project, ...response } : project
        //   )
        // );

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
        // setProjects((prev) => ({
        //   ...prev,
        //   data: prev.data.filter((project) => project.id !== projectId),
        // }));
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

    setActionLoading((prev) => ({ ...prev, count: true }));
    try {
      const counts = await ShowcaseService.getProjectCounts();
      setProjectCounts({
        total: counts.totalProjects || 0,
        owned: counts.myProjects || 0,
        supported: counts.supportedProjects || 0,
        followed: counts.followedProjects || 0,
      });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActionLoading((prev) => ({ ...prev, count: false }));
    }
  }, [user]);

  const getAllProjects = useCallback(
    async (
      filterProjectDto?: FilterProjectInterface | undefined,
      loadMore: boolean = false,
      forceLoad: boolean = false
    ) => {
      if (!user) {
        setError('User not authenticated');
        return;
      }

      // Use refs for pagination and loading
      const currentPagination = paginationRef.current;
      const isLoading = loadingRef.current;
      // Wait briefly for cache rehydration so we can use restored projects list
      if (!loadMore && !forceLoad) {
        try {
          await Promise.race([
            rehydratePromiseRef.current,
            new Promise((res) => setTimeout(res, 2000)),
          ]);
        } catch {
          /* ignore */
        }

        // If we already have projects (rehydrated), avoid refetch on initial mount
        if (allProjects.data.length > 0) return;
      }
      if (loadMore && (isLoading || !currentPagination.hasNext)) {
        return;
      }

      if (!loadMore) setLoading(true);
      try {
        console.log('getting project');
        const response = await ShowcaseService.getAllProjects(filterProjectDto);

        if (loadMore) {
          setAllProjects((prev) => ({
            data: [...prev.data, ...response.data],
            pagination: response.pagination,
          }));
          // setProjects((prev) => ({
          //   data: [...prev.data, ...response.data],
          // }));
        } else {
          setAllProjects({
            data: response.data,
            pagination: response.pagination,
          });
          // setProjects({
          //   pagination: response.pagination,
          //   data: response.data,
          // });
        }
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    },
    [user, allProjects] // pagination and loading handled via refs
  );

  // Enhanced getProjectById with caching
  const getProjectById = useCallback(
    async (projectId: string, forceRefresh: boolean = false, tab?: number) => {
      if (!user) {
        setError('User not authenticated');
        return;
      }

      setActionLoading((prev) => ({
        ...prev,
        projectDetails: new Set(prev.projectDetails).add(projectId),
      }));

      // Check cache first (unless force refresh). Wait briefly for rehydration so restored caches are used.
      if (!forceRefresh) {
        try {
          await Promise.race([
            rehydratePromiseRef.current,
            new Promise((res) => setTimeout(res, 2000)),
          ]);
        } catch {
          /* ignore */
        }

        const cachedProject = getCachedProject(projectId);
        if (cachedProject) {
          setProjectById(cachedProject);
          setProjectByIdUpdates(
            projectsCacheRef.current.get(projectId)?.updates || []
          );
          setActionLoading((prev) => {
            const next = new Set(prev.projectDetails);
            next.delete(projectId);
            return { ...prev, projectDetails: next };
          });
          return;
        }
      }
      try {
        // Try to find an existing lightweight project entry based on the active tab
        const existingProject =
          tab === 0
            ? allProjects.data.find((proj) => proj.id === projectId)
            : tab === 1
              ? projectsByUserId.data.find((proj) => proj.id === projectId)
              : tab === 2
                ? supportedProjects.data.find((proj) => proj.id === projectId)
                : followedProjects.data.find((proj) => proj.id === projectId);
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

        setTeamMembers((prev) => {
          const next = { ...prev };
          delete next[projectId];
          return next;
        });

        setComments((prev) => {
          const next = { ...prev };
          delete next[projectId];
          return next;
        });

        setProjectById(fullProject);
        setProjectByIdUpdates(details.updates || []);

        console.log('Fetched project details:', fullProject);

        // Update cache
        setCachedProject(projectId, fullProject, details.updates || []);

        // if (!existingProject) {
        //   setProjects((prev) => ({
        //     ...prev,
        //     data: [fullProject, ...prev.data],
        //   }));
        // }
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
      }
    },
    [
      user,
      getCachedProject,
      allProjects.data,
      projectsByUserId.data,
      supportedProjects.data,
      followedProjects.data,
      setCachedProject,
    ]
  );

  const getProjectsByUserId = useCallback(
    async (
      ownerId?: string,
      filterProjectDto?: FilterProjectInterface,
      loadMore: boolean = false,
      forceLoad: boolean = false
    ) => {
      if (!user) {
        setError('User not authenticated');
        return;
      }

      const targetOwnerId = ownerId ?? user.id;

      // Wait briefly for cache rehydration so we can use restored my-projects list
      if (!loadMore && !forceLoad) {
        try {
          await Promise.race([
            rehydratePromiseRef.current,
            new Promise((res) => setTimeout(res, 2000)),
          ]);
        } catch {
          /* ignore */
        }

        // If not loading more and we already have data for the same owner, skip fetch
        if (
          projectsByUserId.data.length > 0 &&
          projectsByUserId.data[0]?.owner?.id === targetOwnerId
        ) {
          return;
        }
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
            // setProjects((prev) => ({
            //   data: [...prev.data, ...response.data],
            //   pagination: response.pagination,
            // }));
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
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    },
    [user, projectsByUserId]
  );

  const getSupportedProjects = useCallback(
    async (
      filterProjectDto?: FilterProjectInterface,
      loadMore: boolean = false,
      forceLoad: boolean = false
    ) => {
      if (!user) {
        setError('User not authenticated');
        return;
      }

      // Wait briefly for cache rehydration so we can use restored supported list
      if (!loadMore && !forceLoad) {
        try {
          await Promise.race([
            rehydratePromiseRef.current,
            new Promise((res) => setTimeout(res, 2000)),
          ]);
        } catch {
          /* ignore */
        }

        // Skip fetch if not loading more and we already have data
        if (supportedProjects.data.length > 0) return;
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
      loadMore: boolean = false,
      forceLoad: boolean = false
    ) => {
      if (!user) {
        setError('User not authenticated');
        return;
      }

      // Wait briefly for cache rehydration so we can use restored followed list
      if (!loadMore && !forceLoad) {
        try {
          await Promise.race([
            rehydratePromiseRef.current,
            new Promise((res) => setTimeout(res, 2000)),
          ]);
        } catch {
          /* ignore */
        }

        // Skip fetch if not loading more and we already have data
        if (followedProjects.data.length > 0) return;
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

        const existingProject = allProjects.data.find(
          (p) => p.id === projectId
        );

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
    [allProjects.data, projectById]
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
        setAllProjects((prev) => ({
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

        setProjectsByUserId((prev) => ({
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
          allProjects.data.find((p) => p.id === projectId) ||
          projectsByUserId.data.find((p) => p.id === projectId) ||
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
    [allProjects.data, projectById, projectsByUserId.data, user]
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
        setAllProjects((prev) => ({
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

        setProjectsByUserId((prev) => ({
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
        setAllProjects((prev) => ({
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

        setProjectsByUserId((prev) => ({
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
          allProjects.data.find((p) => p.id === projectId) ||
          projectsByUserId.data.find((p) => p.id === projectId) ||
          (projectById?.id === projectId ? projectById : null);

        if (projToAdd) {
          setFollowedProjects((prev) => ({
            data: [
              { ...projToAdd, followers: [{ userId: user.id }] },
              ...prev.data.filter((p) => p.id !== projectId),
            ],
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
    [user, projectById, allProjects.data, projectsByUserId.data]
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
        setAllProjects((prev) => ({
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

        setProjectsByUserId((prev) => ({
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

      try {
        const response = await ShowcaseService.createComment(
          projectId,
          comment
        );

        setComments((prev) => ({
          ...prev,
          [projectId]: {
            data: [response, ...(prev[projectId]?.data ?? [])],
            pagination: prev[projectId]?.pagination,
          },
        }));

        setProjectById((prev) =>
          prev
            ? {
                ...prev,
                _count: {
                  ...prev._count,
                  comments: (prev._count.comments || 0) + 1,
                },
              }
            : prev
        );

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
        try {
          await Promise.race([
            rehydratePromiseRef.current,
            new Promise((res) => setTimeout(res, 2000)),
          ]);
        } catch {
          /* ignore */
        }

        const cachedComments = getCachedComments(projectId);
        if (cachedComments) {
          setComments((prev) => ({
            ...prev,
            [projectId]: {
              data: cachedComments.comments,
              pagination: cachedComments.pagination,
            },
          }));
          return;
        }
      }

      if (page === 1) {
        setActionLoading((prev) => ({
          ...prev,
          comment: true,
        }));
      }

      try {
        const response = await ShowcaseService.getComments(projectId, page);

        if (page === 1) {
          // First page - replace comments
          setComments((prev) => ({
            ...prev,
            [projectId]: {
              data: response.comments,
              pagination: response.pagination,
            },
          }));
          // Cache first page results
          setCachedComments(projectId, response.comments, response.pagination);
        } else {
          // Subsequent pages - append comments
          setComments((prev) => ({
            ...prev,
            [projectId]: {
              data: [...(prev[projectId]?.data ?? []), ...response.comments],
              pagination: response.pagination,
            },
          }));
        }
      } catch (err) {
        setError(
          `Failed to get project comments: ${err instanceof Error ? err.message : String(err)}`
        );
      } finally {
        setActionLoading((prev) => ({
          ...prev,
          comment: false,
        }));
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
        await ShowcaseService.createProjectTeamMember(projectId, data);
        setTeamMembers((prev) => ({
          ...prev,
          [projectId]: [...(prev[projectId] ?? []), data],
        }));
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
      setActionLoading((prev) => ({
        ...prev,
        teamMembers: true,
      }));
      try {
        const response = await ShowcaseService.getProjectTeamMembers(projectId);
        setTeamMembers((prev) => ({ ...prev, [projectId]: response }));
      } catch (err) {
        setError(
          `Failed to get team members: ${err instanceof Error ? err.message : String(err)}`
        );
      } finally {
        setActionLoading((prev) => ({
          ...prev,
          teamMembers: false,
        }));
      }
    },
    [user]
  );

  const removeProjectTeamMember = useCallback(
    async (projectId: string, teamMemberId: string) => {
      if (!user) {
        setError('User not authenticated');
        return;
      }
      setLoading(true);
      try {
        await ShowcaseService.removeProjectTeamMember(projectId, teamMemberId);
        setTeamMembers((prev) => ({
          ...prev,
          [projectId]: (prev[projectId] ?? []).filter(
            (member) => member.id !== teamMemberId
          ),
        }));
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

  const refreshProjects = useCallback(
    async (tab: number) => {
      if (!user) {
        setError('User not authenticated');
        return;
      }
      setActionLoading((prev) => ({ ...prev, refresh: true }));
      try {
        console.log('Refreshing projects for tab:', tab);
        getProjectCounts();
        if (tab === 0) await getAllProjects({ pageSize: 12 }, false, true);
        if (tab === 1)
          await getProjectsByUserId(user.id, { pageSize: 12 }, false, true);
        if (tab === 2)
          await getSupportedProjects({ pageSize: 12 }, false, true);
        if (tab === 3) await getFollowedProjects({ pageSize: 12 }, false, true);
      } catch (err) {
        setError(
          `Failed to refresh projects: ${err instanceof Error ? err.message : String(err)}`
        );
      } finally {
        setActionLoading((prev) => ({ ...prev, refresh: false }));
      }
    },
    [
      getAllProjects,
      getFollowedProjects,
      getProjectCounts,
      getProjectsByUserId,
      getSupportedProjects,
      user,
    ]
  );

  // New method to clear specific project cache
  const clearSpecificCache = useCallback((projectId: string) => {
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
  }, []);

  const clearProjectsCache = useCallback(() => {
    setAllProjects({
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
      projects: projectsCache instanceof Map ? projectsCache.size : 0,
      comments: commentsCache instanceof Map ? commentsCache.size : 0,
    }),
    [projectsCache, commentsCache]
  );

  const state: ShowcaseContextType = useMemo(
    () => ({
      projectCounts,
      allProjects,
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
      teamMembers,
      cacheInfo,
      allTypes,
      typeLoading,

      // Cache management
      clearError,
      clearSpecificCache,

      // Actions (include all the existing ones)
      refreshProjects,
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
      allProjects,
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
      teamMembers,
      allTypes,
      typeLoading,
      clearError,
      refreshProjects,
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
