import { ConnectionStats, ConnectionSuggestion } from '@/types/connections';
import { getErrorMessage } from '@/utils/errorHandler';
import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import { useAuth } from './AuthContext';
import { DashBoardService } from '@/services/DashBoardService';
import { ProjectInterface } from '@/types/ShowcaseType';
import { ShowcaseService } from '@/services/ShowcaseService';
import { Post } from '@/types/post';
import { getFeedService } from '@/services/PostService';

interface LoadingState {
  dashboard: boolean;
  stats: boolean;
  connections: boolean;
  connecting: boolean;
  projects: boolean;
  posts: boolean;
}

interface ErrorState {
  dashboard: string | null;
  stats: string | null;
  connections: string | null;
  connecting: string | null;
  projects: string | null;
  posts: string | null;
}

type DashboardState = {
  connectionStats: ConnectionStats;
  suggestedConnections: ConnectionSuggestion[];
  projects: ProjectInterface[];
  posts: Post[];
  loading: LoadingState;
  error: ErrorState;
};

type DashboardActions = {
  refreshDashboard: () => Promise<void>;
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

export const DashboardProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState<LoadingState>({
    dashboard: false,
    stats: false,
    connections: false,
    connecting: false,
    projects: false,
    posts: false,
  });
  const [error, setError] = useState<ErrorState>({
    dashboard: null,
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

  const getConnectionStats = useCallback(async () => {
    if (!user?.id) return;
    setLoading((prev) => ({ ...prev, stats: true }));
    try {
      const response = await DashBoardService.getConnectionStats();
      setConnectionStats(response);
      setError((prev) => ({ ...prev, stats: null }));
    } catch (err) {
      setError((prev) => ({ ...prev, stats: getErrorMessage(err) }));
    } finally {
      setLoading((prev) => ({ ...prev, stats: false }));
    }
  }, [user?.id]);

  const getSuggestedConnections = useCallback(
    async (limit?: 10) => {
      if (!user?.id) return;
      setLoading((prev) => ({ ...prev, connections: true }));
      try {
        const response = await DashBoardService.getSuggestedConnections(limit);
        setSuggestedConnections(response);
        setError((prev) => ({ ...prev, connections: null }));
      } catch (err) {
        setError((prev) => ({ ...prev, connections: getErrorMessage(err) }));
      } finally {
        setLoading((prev) => ({ ...prev, connections: false }));
      }
    },
    [user?.id]
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
    try {
      const response = await ShowcaseService.getAllProjects({
        personalize: true,
        pageSize: 5,
      });
      console.log('Suggested Projects Response:', response);
      setProjects(response.data);
      setError((prev) => ({ ...prev, projects: null }));
    } catch (err) {
      setError((prev) => ({ ...prev, projects: getErrorMessage(err) }));
    } finally {
      setLoading((prev) => ({ ...prev, projects: false }));
    }
  }, [user?.id]);

  const getSuggestedPosts = useCallback(async () => {
    if (!user?.id) return;
    setLoading((prev) => ({ ...prev, posts: true }));
    try {
      const response = await getFeedService(1, 5);
      console.log('Suggested Posts Response:', response);
      setPosts(response.posts);
      setError((prev) => ({ ...prev, posts: null }));
    } catch (err) {
      setError((prev) => ({ ...prev, posts: getErrorMessage(err) }));
    } finally {
      setLoading((prev) => ({ ...prev, posts: false }));
    }
  }, [user?.id]);

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
      suggestedConnections,
      connectionStats,
      projects,
      posts,
      refreshDashboard,
      getConnectionStats,
      getSuggestedConnections,
      getSuggestedProjects,
      connectToUser,
      getSuggestedPosts,
    }),
    [
      loading,
      error,
      suggestedConnections,
      connectionStats,
      projects,
      posts,
      refreshDashboard,
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
