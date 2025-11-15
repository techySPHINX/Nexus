import { ConnectionStats, ConnectionSuggestion } from '@/types/connections';
import { getErrorMessage } from '@/utils/errorHandler';
import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useRef,
} from 'react';
import { useAuth } from './AuthContext';
import { DashBoardService } from '@/services/DashBoardService';
import { ProjectInterface } from '@/types/ShowcaseType';
import { Post } from '@/types/post';
const { ShowcaseService } = await import('@/services/ShowcaseService');

interface LoadingState {
  dashboard: boolean;
  stats: boolean;
  connections: boolean;
  connecting: boolean;
  projects: boolean;
  profileCompletion: boolean;
  posts: boolean;
}

interface ErrorState {
  dashboard: string | null;
  stats: string | null;
  connections: string | null;
  connecting: string | null;
  projects: string | null;
  profileCompletion: string | null;
  posts: string | null;
}

interface ProfileCompletionStats {
  completionPercentage?: number;
  details?: {
    avatar: boolean;
    bio: boolean;
    location: boolean;
    branch: boolean;
    year: boolean;
    dept: boolean;
    skillsCount: number;
    interestsCount: number;
    courseCount: number;
  };
}

type DashboardState = {
  profileCompletionStats: ProfileCompletionStats;
  connectionStats: ConnectionStats;
  suggestedConnections: ConnectionSuggestion[];
  projects: ProjectInterface[];
  posts: Post[];
  loading: LoadingState;
  error: ErrorState;
};

type DashboardActions = {
  refreshDashboard: () => Promise<void>;
  getProfileCompletionStats: () => Promise<void>;
  getConnectionStats: () => Promise<void>;
  getSuggestedConnections: (limit?: 10) => Promise<void>;
  connectToUser: (userId: string) => Promise<void>;
  getSuggestedProjects: () => Promise<void>;
  getSuggestedPosts: () => Promise<void>;
};

type DashboardContextType = DashboardState & DashboardActions;

const DashboardContext = createContext<DashboardContextType | undefined>(
  undefined
);

const DashboardProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState<LoadingState>({
    dashboard: false,
    profileCompletion: false,
    stats: false,
    connections: false,
    connecting: false,
    projects: false,
    posts: false,
  });
  const [error, setError] = useState<ErrorState>({
    dashboard: null,
    profileCompletion: null,
    stats: null,
    connections: null,
    connecting: null,
    projects: null,
    posts: null,
  });

  const [connectionStats, setConnectionStats] = useState<ConnectionStats>({
    total: 0,
    pendingReceived: 0,
    pendingSent: 0,
    byRole: {
      students: 0,
      alumni: 0,
    },
    recent30Days: 0,
  });
  const [suggestedConnections, setSuggestedConnections] = useState<
    ConnectionSuggestion[]
  >([]);
  const [projects, setProjects] = useState<ProjectInterface[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [profileCompletionStats, setProfileCompletionStats] =
    useState<ProfileCompletionStats>({});

  // Simple caching strategy: use in-memory + localStorage with TTL per resource.
  // This prevents frequent API calls when the user repeatedly opens the dashboard.
  const CACHE_PREFIX = 'nexus:dashboard:';
  const TTL = {
    stats: 60 * 1000, // 1 minute
    connections: 5 * 60 * 1000, // 5 minutes
    projects: 10 * 60 * 1000, // 10 minutes
    posts: 2 * 60 * 1000, // 2 minutes
    profileCompletion: 5 * 60 * 1000, // 5 minutes
  } as const;

  // Simple in-memory cache to avoid parse overhead during a single session
  const memoryCacheRef = useRef<Record<string, { ts: number; data: unknown }>>(
    {}
  );

  // Track in-flight promises per resource to deduplicate concurrent requests
  const inFlightRef = useRef<Record<string, Promise<unknown> | null>>({});
  // Request counters for debugging/instrumentation (temporary)
  const requestCountsRef = useRef<Record<string, number>>({});

  const incrRequestCount = (key: string) => {
    requestCountsRef.current[key] = (requestCountsRef.current[key] || 0) + 1;
    // lightweight console debug so devs can see counts in the browser console

    console.debug(
      '[DashBoardContext] requestCount',
      key,
      requestCountsRef.current[key]
    );
  };

  const readCache = useCallback(<T,>(key: string, maxAge: number): T | null => {
    const k = CACHE_PREFIX + key;
    // check in-memory first
    const mem = memoryCacheRef.current[k];
    const now = Date.now();
    if (mem && now - mem.ts < maxAge) return mem.data as T;

    try {
      const raw = localStorage.getItem(k);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as { ts: number; data: T };
      if (now - parsed.ts < maxAge) {
        // populate memory cache for faster subsequent reads
        memoryCacheRef.current[k] = parsed;
        return parsed.data;
      }
      // stale
      return null;
    } catch {
      // if corrupt, clear it
      localStorage.removeItem(k);
      return null;
    }
  }, []);

  const writeCache = useCallback(<T,>(key: string, data: T) => {
    const k = CACHE_PREFIX + key;
    const payload = { ts: Date.now(), data };
    memoryCacheRef.current[k] = payload;
    try {
      localStorage.setItem(k, JSON.stringify(payload));
    } catch {
      // ignore quota errors
    }
  }, []);

  const getProfileCompletionStats = useCallback(async () => {
    if (!user?.id) return;
    setLoading((prev) => ({ ...prev, profileCompletion: true }));
    try {
      const key = 'profileCompletion';
      if (inFlightRef.current[key]) {
        await inFlightRef.current[key];
        return;
      }

      const promise = (async () => {
        // try cache first
        const cached = readCache<ProfileCompletionStats>(
          'profileCompletion',
          TTL.profileCompletion
        );
        if (cached) {
          setProfileCompletionStats(cached);
          setError((prev) => ({ ...prev, profileCompletion: null }));
          return;
        }
        // debug: increment request counter for profileCompletion
        incrRequestCount('profileCompletion');
        const response = await DashBoardService.getProfileCompletionStats();
        console.log('Profile Completion Stats Response:', response);
        setProfileCompletionStats(response);
        writeCache('profileCompletion', response);
        setError((prev) => ({ ...prev, profileCompletion: null }));
      })();

      inFlightRef.current[key] = promise;
      try {
        await promise;
      } finally {
        inFlightRef.current[key] = null;
      }
      return;
    } catch (err) {
      setError((prev) => ({
        ...prev,
        profileCompletion: getErrorMessage(err),
      }));
    } finally {
      setLoading((prev) => ({ ...prev, profileCompletion: false }));
    }
  }, [user?.id, readCache, writeCache, TTL.profileCompletion]);

  const getConnectionStats = useCallback(async () => {
    if (!user?.id) return;
    setLoading((prev) => ({ ...prev, stats: true }));
    try {
      const key = 'stats';
      if (inFlightRef.current[key]) {
        await inFlightRef.current[key];
        return;
      }

      const promise = (async () => {
        const cached = readCache<ConnectionStats>('stats', TTL.stats);
        if (cached) {
          setConnectionStats(cached);
          setError((prev) => ({ ...prev, stats: null }));
          return;
        }
        // increment debug counter for the network call
        incrRequestCount('stats');
        const response = await DashBoardService.getConnectionStats();
        setConnectionStats(response);
        writeCache('stats', response);
        setError((prev) => ({ ...prev, stats: null }));
      })();

      inFlightRef.current[key] = promise;
      try {
        await promise;
      } finally {
        inFlightRef.current[key] = null;
      }
      return;
    } catch (err) {
      setError((prev) => ({ ...prev, stats: getErrorMessage(err) }));
    } finally {
      setLoading((prev) => ({ ...prev, stats: false }));
    }
  }, [user?.id, readCache, writeCache, TTL.stats]);

  const getSuggestedConnections = useCallback(
    async (limit?: 10) => {
      if (!user?.id) return;
      setLoading((prev) => ({ ...prev, connections: true }));
      try {
        const key = `connections:${limit ?? 10}`;
        // Deduplicate concurrent fetches for the same key
        if (inFlightRef.current[key]) {
          await inFlightRef.current[key];
          return;
        }

        const cached = readCache<ConnectionSuggestion[]>(key, TTL.connections);
        if (cached) {
          setSuggestedConnections(cached);
          setError((prev) => ({ ...prev, connections: null }));
          return;
        }

        const promise = (async () => {
          // debug: increment request counter for this key
          incrRequestCount(key);
          const response =
            await DashBoardService.getSuggestedConnections(limit);
          setSuggestedConnections(response);
          writeCache(key, response);
          setError((prev) => ({ ...prev, connections: null }));
        })();

        inFlightRef.current[key] = promise;
        try {
          await promise;
        } finally {
          inFlightRef.current[key] = null;
        }
      } catch (err) {
        setError((prev) => ({ ...prev, connections: getErrorMessage(err) }));
      } finally {
        setLoading((prev) => ({ ...prev, connections: false }));
      }
    },
    [user?.id, readCache, writeCache, TTL.connections]
  );

  const connectToUser = useCallback(
    async (userId: string) => {
      if (!user?.id) return;
      setLoading((prev) => ({ ...prev, connecting: true }));
      try {
        await DashBoardService.connectToUser(userId);
        setError((prev) => ({ ...prev, connecting: null }));
      } catch (err) {
        setError((prev) => ({ ...prev, connecting: getErrorMessage(err) }));
      } finally {
        setLoading((prev) => ({ ...prev, connecting: false }));
      }
    },
    [user?.id]
  );

  const getSuggestedProjects = useCallback(async () => {
    if (!user?.id) return;
    setLoading((prev) => ({ ...prev, projects: true }));
    if (projects.length > 0) {
      setLoading((prev) => ({ ...prev, projects: false }));
      return;
    }
    try {
      const key = 'projects';
      if (inFlightRef.current[key]) {
        await inFlightRef.current[key];
        return;
      }

      const cached = readCache<ProjectInterface[]>('projects', TTL.projects);
      if (cached) {
        setProjects(cached);
        setLoading((prev) => ({ ...prev, projects: false }));
        setError((prev) => ({ ...prev, projects: null }));
        return;
      }

      const promise = (async () => {
        const response = await ShowcaseService.getAllProjects({
          personalize: true,
          pageSize: 5,
        });
        // debug: increment request counter for projects
        incrRequestCount('projects');
        console.log('Suggested Projects Response:', response);
        setProjects(response.data);
        writeCache('projects', response.data);
        setError((prev) => ({ ...prev, projects: null }));
      })();

      inFlightRef.current[key] = promise;
      try {
        await promise;
      } finally {
        inFlightRef.current[key] = null;
      }
    } catch (err) {
      setError((prev) => ({ ...prev, projects: getErrorMessage(err) }));
    } finally {
      setLoading((prev) => ({ ...prev, projects: false }));
    }
  }, [projects.length, user?.id, readCache, writeCache, TTL.projects]);

  const getSuggestedPosts = useCallback(async () => {
    if (!user?.id) return;
    setLoading((prev) => ({ ...prev, posts: true }));
    try {
      const key = 'posts';
      if (inFlightRef.current[key]) {
        await inFlightRef.current[key];
        return;
      }

      const cached = readCache<Post[]>('posts', TTL.posts);
      if (cached) {
        setPosts(cached);
        setError((prev) => ({ ...prev, posts: null }));
        return;
      }

      const promise = (async () => {
        // debug: increment request counter for posts
        incrRequestCount('posts');
        const response = await DashBoardService.getRecentPostsService(1, 6);
        console.log('Suggested Posts Response:', response);
        setPosts(response.posts);
        writeCache('posts', response.posts);
        setError((prev) => ({ ...prev, posts: null }));
      })();

      inFlightRef.current[key] = promise;
      try {
        await promise;
      } finally {
        inFlightRef.current[key] = null;
      }
    } catch (err) {
      setError((prev) => ({ ...prev, posts: getErrorMessage(err) }));
    } finally {
      setLoading((prev) => ({ ...prev, posts: false }));
    }
  }, [user?.id, readCache, writeCache, TTL.posts]);

  const refreshDashboard = useCallback(async () => {
    setLoading((prev) => ({ ...prev, dashboard: true }));
    try {
      getConnectionStats();
      getSuggestedConnections(10);
      getSuggestedProjects();
      setError((prev) => ({ ...prev, dashboard: null }));
    } catch (err) {
      setError((prev) => ({ ...prev, dashboard: getErrorMessage(err) }));
    } finally {
      setLoading((prev) => ({ ...prev, dashboard: false }));
    }
  }, [getConnectionStats, getSuggestedConnections, getSuggestedProjects]);

  const value = useMemo<DashboardContextType>(
    () => ({
      loading,
      error,
      profileCompletionStats,
      suggestedConnections,
      connectionStats,
      projects,
      posts,
      refreshDashboard,
      getProfileCompletionStats,
      getConnectionStats,
      getSuggestedConnections,
      getSuggestedProjects,
      connectToUser,
      getSuggestedPosts,
    }),
    [
      loading,
      error,
      profileCompletionStats,
      suggestedConnections,
      connectionStats,
      projects,
      posts,
      refreshDashboard,
      getProfileCompletionStats,
      getConnectionStats,
      getSuggestedConnections,
      connectToUser,
      getSuggestedProjects,
      getSuggestedPosts,
    ]
  );

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboardContext = (): DashboardContextType => {
  const ctx = useContext(DashboardContext);
  if (!ctx) {
    throw new Error(
      'useDashboardContext must be used within DashboardProvider'
    );
  }
  return ctx;
};

export default DashboardProvider;
