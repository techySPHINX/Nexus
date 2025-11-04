// StartupContext.tsx
import React, { useCallback, useState } from 'react';
import { ShowcaseService } from '@/services/ShowcaseService';
import {
  StartupSummary,
  StartupDetail,
  StartupCommentsResponse,
  StartupComment,
} from '@/types/StartupType';

export interface StartupListState {
  data: StartupSummary[];
  nextCursor: string | null;
  hasNext: boolean;
  loading: boolean;
  pageSize?: number;
}

export interface StartupContextType {
  // separate states per tab
  all: StartupListState;
  mine: StartupListState;
  followed: StartupListState;
  // fetch functions: if append=true will merge results (load-more)
  getStartups: (
    filter?: {
      search?: string;
      status?: string;
      cursor?: string | null;
      pageSize?: number;
    },
    append?: boolean,
    forceLoad?: boolean
  ) => Promise<void | {
    nextCursor?: string | null;
    hasNext?: boolean;
    pageSize?: number;
  }>;
  getMyStartups: (
    filter?: {
      search?: string;
      status?: string;
      cursor?: string | null;
      pageSize?: number;
    },
    append?: boolean,
    forceLoad?: boolean
  ) => Promise<void | {
    nextCursor?: string | null;
    hasNext?: boolean;
    pageSize?: number;
  }>;
  getFollowedStartups: (
    filter?: {
      search?: string;
      status?: string;
      cursor?: string | null;
      pageSize?: number;
    },
    append?: boolean,
    forceLoad?: boolean
  ) => Promise<void | {
    nextCursor?: string | null;
    hasNext?: boolean;
    pageSize?: number;
  }>;
  getStartupById: (id: string) => Promise<StartupDetail | null>;
  followStartup: (id: string) => Promise<void>;
  unfollowStartup: (id: string) => Promise<void>;
  createComment: (
    startupId: string,
    comment: string
  ) => Promise<StartupComment>;
  getComments: (
    startupId: string,
    page?: number
  ) => Promise<StartupCommentsResponse | null>;
  createStartup: (data: Partial<StartupSummary>) => Promise<void>;
  updateStartup: (id: string, data: Partial<StartupSummary>) => Promise<void>;
  deleteStartup: (id: string) => Promise<void>;
}

export const StartupContext = React.createContext<StartupContextType>({
  all: { data: [], nextCursor: null, hasNext: false, loading: false },
  mine: { data: [], nextCursor: null, hasNext: false, loading: false },
  followed: { data: [], nextCursor: null, hasNext: false, loading: false },
  getStartups: async () => {},
  getMyStartups: async () => {},
  getFollowedStartups: async () => {},
  getStartupById: async () => null,
  followStartup: async () => {},
  unfollowStartup: async () => {},
  createComment: async () => ({}) as StartupComment,
  getComments: async () => null,
  createStartup: async () => {},
  updateStartup: async () => {},
  deleteStartup: async () => {},
});

export const StartupProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  type RawStartup = StartupSummary & { startupFollower?: { userId: string }[] };

  const [all, setAll] = useState<StartupListState>({
    data: [],
    nextCursor: null,
    hasNext: false,
    loading: false,
    pageSize: 12,
  });

  const [mine, setMine] = useState<StartupListState>({
    data: [],
    nextCursor: null,
    hasNext: false,
    loading: false,
    pageSize: 12,
  });

  const [followed, setFollowed] = useState<StartupListState>({
    data: [],
    nextCursor: null,
    hasNext: false,
    loading: false,
    pageSize: 12,
  });

  // Refs to avoid duplicate fetches and inspect pagination/loading without stale closures
  const allPaginationRef = React.useRef({
    nextCursor: all.nextCursor,
    hasNext: all.hasNext,
  });
  const allLoadingRef = React.useRef(all.loading);
  const allFilterRef = React.useRef<string | null>(null);
  const minePaginationRef = React.useRef({
    nextCursor: mine.nextCursor,
    hasNext: mine.hasNext,
  });
  const mineLoadingRef = React.useRef(mine.loading);
  const mineFilterRef = React.useRef<string | null>(null);
  const followedPaginationRef = React.useRef({
    nextCursor: followed.nextCursor,
    hasNext: followed.hasNext,
  });
  const followedLoadingRef = React.useRef(followed.loading);
  const followedFilterRef = React.useRef<string | null>(null);
  const allDataRef = React.useRef(all.data);
  const mineDataRef = React.useRef(mine.data);
  const followedDataRef = React.useRef(followed.data);

  // keep refs in sync with state to avoid stale closures and enable safe early-returns
  React.useEffect(() => {
    allPaginationRef.current = {
      nextCursor: all.nextCursor,
      hasNext: all.hasNext,
    };
    allLoadingRef.current = all.loading;
    allDataRef.current = all.data;

    minePaginationRef.current = {
      nextCursor: mine.nextCursor,
      hasNext: mine.hasNext,
    };
    mineLoadingRef.current = mine.loading;
    mineDataRef.current = mine.data;

    followedPaginationRef.current = {
      nextCursor: followed.nextCursor,
      hasNext: followed.hasNext,
    };
    followedLoadingRef.current = followed.loading;
    followedDataRef.current = followed.data;
  }, [all, mine, followed]);

  const getStartups = useCallback(
    async (
      filter?: {
        search?: string;
        status?: string;
        cursor?: string | null;
        pageSize?: number;
      },
      append = false,
      forceLoad = false
    ) => {
      const currentPagination = allPaginationRef.current;
      const isLoading = allLoadingRef.current;
      const currentData = allDataRef.current;

      const incomingFilterKey = JSON.stringify({
        search: filter?.search || null,
        status: filter?.status || null,
      });

      // If append requested but filter has changed, treat as non-append (replace)
      const effectiveAppend =
        append && allFilterRef.current === incomingFilterKey;

      // If not loading more (or append was turned off) and not forced, avoid refetch when we already have same-filter data
      if (!effectiveAppend && !forceLoad) {
        if (
          currentData &&
          currentData.length > 0 &&
          allFilterRef.current === incomingFilterKey
        )
          return;
      }

      // If loadMore requested but already loading or no next page, skip
      if (effectiveAppend && (isLoading || !currentPagination.hasNext)) return;

      if (!append) setAll((s) => ({ ...s, loading: true }));
      try {
        const cursorToUse = effectiveAppend
          ? (filter?.cursor ?? currentPagination.nextCursor)
          : filter?.cursor;
        const res = await ShowcaseService.getStartups({
          ...(filter || {}),
          cursor: cursorToUse,
          pageSize: filter?.pageSize ?? all.pageSize,
        });
        const data = res?.data || [];
        const normalized = (data || []).map((s: RawStartup) => ({
          ...s,
          isFollowing: !!s.isFollowing,
          followersCount:
            typeof s.followersCount === 'number'
              ? s.followersCount
              : Array.isArray(s.startupFollower)
                ? s.startupFollower.length
                : 0,
        }));

        if (effectiveAppend) {
          setAll((prev) => ({
            ...prev,
            data: [...prev.data, ...normalized],
            nextCursor: res?.pagination?.nextCursor ?? null,
            hasNext: !!res?.pagination?.hasNext,
          }));
        } else {
          setAll({
            data: normalized,
            nextCursor: res?.pagination?.nextCursor ?? null,
            hasNext: !!res?.pagination?.hasNext,
            loading: false,
            pageSize: filter?.pageSize ?? all.pageSize,
          });
        }

        // update last-applied filter key when replacing data (not appending)
        if (!effectiveAppend) {
          allFilterRef.current = incomingFilterKey;
        }

        return res?.pagination;
      } catch (err) {
        console.error('Failed to load startups', err);
        return undefined;
      } finally {
        setAll((s) => ({ ...s, loading: false }));
      }
    },
    [all.pageSize]
  );

  const getMyStartups = useCallback(
    async (
      filter?: {
        search?: string;
        status?: string;
        cursor?: string | null;
        pageSize?: number;
      },
      append = false,
      forceLoad = false
    ) => {
      const currentPagination = minePaginationRef.current;
      const isLoading = mineLoadingRef.current;
      const currentData = mineDataRef.current;

      const incomingFilterKey = JSON.stringify({
        search: filter?.search || null,
        status: filter?.status || null,
      });

      const effectiveAppend =
        append && mineFilterRef.current === incomingFilterKey;

      if (!effectiveAppend && !forceLoad) {
        if (
          currentData &&
          currentData.length > 0 &&
          mineFilterRef.current === incomingFilterKey
        )
          return;
      }

      if (effectiveAppend && (isLoading || !currentPagination.hasNext)) return;

      if (!append) setMine((s) => ({ ...s, loading: true }));
      try {
        const cursorToUse = effectiveAppend
          ? (filter?.cursor ?? currentPagination.nextCursor)
          : filter?.cursor;
        const res = await ShowcaseService.getMyStartups({
          ...(filter || {}),
          cursor: cursorToUse,
          pageSize: filter?.pageSize ?? mine.pageSize,
        });
        const data = res?.data || [];
        const normalized = (data || []).map((s: RawStartup) => ({
          ...s,
          isFollowing: !!s.isFollowing,
          followersCount:
            typeof s.followersCount === 'number'
              ? s.followersCount
              : Array.isArray(s.startupFollower)
                ? s.startupFollower.length
                : 0,
        }));

        if (effectiveAppend) {
          setMine((prev) => ({
            ...prev,
            data: [...prev.data, ...normalized],
            nextCursor: res?.pagination?.nextCursor ?? null,
            hasNext: !!res?.pagination?.hasNext,
          }));
        } else {
          setMine({
            data: normalized,
            nextCursor: res?.pagination?.nextCursor ?? null,
            hasNext: !!res?.pagination?.hasNext,
            loading: false,
            pageSize: filter?.pageSize ?? mine.pageSize,
          });
        }

        if (!effectiveAppend) {
          mineFilterRef.current = incomingFilterKey;
        }

        return res?.pagination;
      } catch (err) {
        console.error('Failed to load my startups', err);
        return undefined;
      } finally {
        setMine((s) => ({ ...s, loading: false }));
      }
    },
    [mine.pageSize]
  );

  const getFollowedStartups = useCallback(
    async (
      filter?: {
        search?: string;
        status?: string;
        cursor?: string | null;
        pageSize?: number;
      },
      append = false,
      forceLoad = false
    ) => {
      const currentPagination = followedPaginationRef.current;
      const isLoading = followedLoadingRef.current;
      const currentData = followedDataRef.current;

      const incomingFilterKey = JSON.stringify({
        search: filter?.search || null,
        status: filter?.status || null,
      });

      const effectiveAppend =
        append && followedFilterRef.current === incomingFilterKey;

      if (!effectiveAppend && !forceLoad) {
        if (
          currentData &&
          currentData.length > 0 &&
          followedFilterRef.current === incomingFilterKey
        )
          return;
      }

      if (effectiveAppend && (isLoading || !currentPagination.hasNext)) return;

      if (!append) setFollowed((s) => ({ ...s, loading: true }));
      try {
        const cursorToUse = effectiveAppend
          ? (filter?.cursor ?? currentPagination.nextCursor)
          : filter?.cursor;
        const res = await ShowcaseService.getFollowedStartups({
          ...(filter || {}),
          cursor: cursorToUse,
          pageSize: filter?.pageSize ?? followed.pageSize,
        });
        const data = res?.data || [];
        const normalized = (data || []).map((s: RawStartup) => ({
          ...s,
          isFollowing: !!s.isFollowing,
          followersCount:
            typeof s.followersCount === 'number'
              ? s.followersCount
              : Array.isArray(s.startupFollower)
                ? s.startupFollower.length
                : 0,
        }));

        if (effectiveAppend) {
          setFollowed((prev) => ({
            ...prev,
            data: [...prev.data, ...normalized],
            nextCursor: res?.pagination?.nextCursor ?? null,
            hasNext: !!res?.pagination?.hasNext,
          }));
        } else {
          setFollowed({
            data: normalized,
            nextCursor: res?.pagination?.nextCursor ?? null,
            hasNext: !!res?.pagination?.hasNext,
            loading: false,
            pageSize: filter?.pageSize ?? followed.pageSize,
          });
        }

        if (!effectiveAppend) {
          followedFilterRef.current = incomingFilterKey;
        }

        return res?.pagination;
      } catch (err) {
        console.error('Failed to load followed startups', err);
        return undefined;
      } finally {
        setFollowed((s) => ({ ...s, loading: false }));
      }
    },
    [followed.pageSize]
  );

  const getStartupById = useCallback(async (id: string) => {
    try {
      const data = await ShowcaseService.getStartupById(id);
      return data || null;
    } catch (err) {
      console.error('Failed to get startup by id', err);
      return null;
    }
  }, []);

  const followStartup = useCallback(async (id: string) => {
    // optimistic update across all lists
    setAll((prev) => ({
      ...prev,
      data: prev.data.map((s) =>
        s.id === id
          ? {
              ...s,
              isFollowing: true,
              followersCount: (s.followersCount || 0) + 1,
            }
          : s
      ),
    }));
    setMine((prev) => ({
      ...prev,
      data: prev.data.map((s) =>
        s.id === id
          ? {
              ...s,
              isFollowing: true,
              followersCount: (s.followersCount || 0) + 1,
            }
          : s
      ),
    }));
    setFollowed((prev) => ({
      ...prev,
      data: prev.data.map((s) =>
        s.id === id
          ? {
              ...s,
              isFollowing: true,
              followersCount: (s.followersCount || 0) + 1,
            }
          : s
      ),
    }));

    try {
      const res = await ShowcaseService.followStartup(id);
      if (res && typeof res.followersCount === 'number') {
        setAll((prev) => ({
          ...prev,
          data: prev.data.map((s) =>
            s.id === id
              ? {
                  ...s,
                  isFollowing: !!res.isFollowing,
                  followersCount: res.followersCount,
                }
              : s
          ),
        }));
        setMine((prev) => ({
          ...prev,
          data: prev.data.map((s) =>
            s.id === id
              ? {
                  ...s,
                  isFollowing: !!res.isFollowing,
                  followersCount: res.followersCount,
                }
              : s
          ),
        }));
        setFollowed((prev) => ({
          ...prev,
          data: prev.data.map((s) =>
            s.id === id
              ? {
                  ...s,
                  isFollowing: !!res.isFollowing,
                  followersCount: res.followersCount,
                }
              : s
          ),
        }));
      }
    } catch (err) {
      console.error('Failed to follow startup', err);
      // rollback optimistic update
      setAll((prev) => ({
        ...prev,
        data: prev.data.map((s) =>
          s.id === id
            ? {
                ...s,
                isFollowing: false,
                followersCount: Math.max((s.followersCount || 1) - 1, 0),
              }
            : s
        ),
      }));
      setMine((prev) => ({
        ...prev,
        data: prev.data.map((s) =>
          s.id === id
            ? {
                ...s,
                isFollowing: false,
                followersCount: Math.max((s.followersCount || 1) - 1, 0),
              }
            : s
        ),
      }));
      setFollowed((prev) => ({
        ...prev,
        data: prev.data.map((s) =>
          s.id === id
            ? {
                ...s,
                isFollowing: false,
                followersCount: Math.max((s.followersCount || 1) - 1, 0),
              }
            : s
        ),
      }));
      throw err;
    }
  }, []);

  const unfollowStartup = useCallback(async (id: string) => {
    // optimistic update
    setAll((prev) => ({
      ...prev,
      data: prev.data.map((s) =>
        s.id === id
          ? {
              ...s,
              isFollowing: false,
              followersCount: Math.max((s.followersCount || 1) - 1, 0),
            }
          : s
      ),
    }));
    setMine((prev) => ({
      ...prev,
      data: prev.data.map((s) =>
        s.id === id
          ? {
              ...s,
              isFollowing: false,
              followersCount: Math.max((s.followersCount || 1) - 1, 0),
            }
          : s
      ),
    }));
    setFollowed((prev) => ({
      ...prev,
      data: prev.data.map((s) =>
        s.id === id
          ? {
              ...s,
              isFollowing: false,
              followersCount: Math.max((s.followersCount || 1) - 1, 0),
            }
          : s
      ),
    }));

    try {
      const res = await ShowcaseService.unfollowStartup(id);
      if (res && typeof res.followersCount === 'number') {
        setAll((prev) => ({
          ...prev,
          data: prev.data.map((s) =>
            s.id === id
              ? {
                  ...s,
                  isFollowing: !!res.isFollowing,
                  followersCount: res.followersCount,
                }
              : s
          ),
        }));
        setMine((prev) => ({
          ...prev,
          data: prev.data.map((s) =>
            s.id === id
              ? {
                  ...s,
                  isFollowing: !!res.isFollowing,
                  followersCount: res.followersCount,
                }
              : s
          ),
        }));
        setFollowed((prev) => ({
          ...prev,
          data: prev.data.map((s) =>
            s.id === id
              ? {
                  ...s,
                  isFollowing: !!res.isFollowing,
                  followersCount: res.followersCount,
                }
              : s
          ),
        }));
      }
    } catch (err) {
      console.error('Failed to unfollow startup', err);
      // rollback
      setAll((prev) => ({
        ...prev,
        data: prev.data.map((s) =>
          s.id === id
            ? {
                ...s,
                isFollowing: true,
                followersCount: (s.followersCount || 0) + 1,
              }
            : s
        ),
      }));
      setMine((prev) => ({
        ...prev,
        data: prev.data.map((s) =>
          s.id === id
            ? {
                ...s,
                isFollowing: true,
                followersCount: (s.followersCount || 0) + 1,
              }
            : s
        ),
      }));
      setFollowed((prev) => ({
        ...prev,
        data: prev.data.map((s) =>
          s.id === id
            ? {
                ...s,
                isFollowing: true,
                followersCount: (s.followersCount || 0) + 1,
              }
            : s
        ),
      }));
      throw err;
    }
  }, []);

  const createComment = useCallback(
    async (startupId: string, comment: string) => {
      try {
        const res = await ShowcaseService.createStartupComment(
          startupId,
          comment
        );
        return res;
      } catch (err) {
        console.error('Failed to create startup comment', err);
        throw err;
      }
    },
    []
  );

  const getComments = useCallback(
    async (startupId: string, page: number = 1) => {
      try {
        const data = await ShowcaseService.getStartupComments(startupId, page);
        return data || null;
      } catch (err) {
        console.error('Failed to get startup comments', err);
        return null;
      }
    },
    []
  );

  const createStartup = useCallback(
    async (data: Partial<StartupSummary>) => {
      try {
        await ShowcaseService.createStartup(data);
        await getStartups(); // Refresh the list
      } catch (err) {
        console.error('Failed to create startup', err);
        throw err;
      }
    },
    [getStartups]
  );

  const updateStartup = useCallback(
    async (id: string, data: Partial<StartupSummary>) => {
      try {
        await ShowcaseService.updateStartup(id, data);
        await getStartups(); // Refresh the list
      } catch (err) {
        console.error('Failed to update startup', err);
        throw err;
      }
    },
    [getStartups]
  );

  const deleteStartup = useCallback(async (id: string) => {
    try {
      await ShowcaseService.deleteStartup(id);
      setAll((prev) => ({
        ...prev,
        data: prev.data.filter((s) => s.id !== id),
      }));
      setMine((prev) => ({
        ...prev,
        data: prev.data.filter((s) => s.id !== id),
      }));
      setFollowed((prev) => ({
        ...prev,
        data: prev.data.filter((s) => s.id !== id),
      }));
    } catch (err) {
      console.error('Failed to delete startup', err);
      throw err;
    }
  }, []);

  //   useEffect(() => {
  //     getStartups();
  //   }, [getStartups]);

  return (
    <StartupContext.Provider
      value={{
        all,
        mine,
        followed,
        getStartups,
        getMyStartups,
        getFollowedStartups,
        getStartupById,
        followStartup,
        unfollowStartup,
        createComment,
        getComments,
        createStartup,
        updateStartup,
        deleteStartup,
      }}
    >
      {children}
    </StartupContext.Provider>
  );
};

export const useStartup = () => React.useContext(StartupContext);
