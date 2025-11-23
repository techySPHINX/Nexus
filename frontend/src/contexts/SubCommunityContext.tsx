import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import { subCommunityService } from '../services/subCommunityService';
import {
  SubCommunity,
  SubCommunityMember,
  JoinRequest,
  SubCommunityCreationRequest,
  SubCommunityRole,
  CreateSubCommunityRequestDto,
  ApproveJoinRequestDto,
  SubCommunityTypeResponse,
  SubCommunityType,
  UpdateSubCommunityDto,
} from '../types/subCommunity';
import { useAuth } from './AuthContext';
import { getErrorMessage } from '@/utils/errorHandler';

interface SubCommunityContextType {
  // State
  subCommunities: SubCommunity[];
  subCommunitiesByType: SubCommunity[];
  types: SubCommunityType[];
  currentSubCommunity: SubCommunity | null;
  subCommunityCache: Record<string, SubCommunityTypeResponse>;
  members: SubCommunityMember[];
  joinRequests: JoinRequest[];
  creationRequests: SubCommunityCreationRequest[];
  loading: boolean;
  error: string;

  // Actions - All return Promise<void>
  getAllSubCommunities: () => Promise<void>;
  // Ensure helpers - idempotent loaders to avoid duplicate requests
  ensureAllSubCommunities: (forceRefresh?: boolean) => Promise<void>;
  getSubCommunity: (id: string) => Promise<void>;
  getSubCommunityByType: (
    type: string,
    page?: number,
    limit?: number,
    q?: string,
    forceRefresh?: boolean
  ) => Promise<SubCommunityTypeResponse>;
  // Per-type paging helpers
  ensureTypeLoaded: (type: string, limit?: number, q?: string) => Promise<void>;
  loadMoreForType: (type: string, limit?: number, q?: string) => Promise<void>;
  createSubCommunity: (data: {
    name: string;
    description: string;
    isPrivate: boolean;
    ownerId: string;
  }) => Promise<void>;
  updateSubCommunity: (
    id: string,
    data: UpdateSubCommunityDto
  ) => Promise<void>;
  deleteSubCommunity: (id: string) => Promise<void>;
  requestToJoin: (subCommunityId: string) => Promise<void>;
  getPendingJoinRequests: (subCommunityId: string) => Promise<void>;
  approveJoinRequest: (
    subCommunityId: string,
    joinRequestId: string,
    dto: ApproveJoinRequestDto
  ) => Promise<void>;
  leaveSubCommunity: (subCommunityId: string) => Promise<void>;
  removeMember: (subCommunityId: string, memberId: string) => Promise<void>;
  updateMemberRole: (
    subCommunityId: string,
    memberId: string,
    role: SubCommunityRole
  ) => Promise<void>;
  createSubCommunityRequest: (
    dto: CreateSubCommunityRequestDto,
    documents?: File[]
  ) => Promise<void>;
  getAllSubCommunityRequests: () => Promise<void>;
  approveSubCommunityRequest: (requestId: string) => Promise<void>;
  rejectSubCommunityRequest: (requestId: string) => Promise<void>;

  // Utilities
  setError: (error: string) => void;
  clearError: () => void;
  ensureTypes: () => Promise<SubCommunityType[]>;
  // helpers
  isLoadingForType: (type: string) => boolean;
  hasMoreForType: (type: string, limit?: number, q?: string) => boolean;
  getRemainingForType: (
    type: string,
    limit?: number,
    q?: string
  ) => number | undefined;
  // Whether any per-section load is currently in progress
  isAnySectionLoading: () => boolean;
  // Whether a section-level load is currently in progress (useful for UI)
  sectionLoadInProgress: boolean;
  // My communities (owned/moderated/member) with pagination
  mySubCommunities: {
    owned: SubCommunityTypeResponse;
    moderated: SubCommunityTypeResponse;
    member: SubCommunityTypeResponse;
  } | null;
  fetchMySubCommunities: (opts?: {
    ownedPage?: number;
    ownedLimit?: number;
    moderatedPage?: number;
    moderatedLimit?: number;
    memberPage?: number;
    memberLimit?: number;
  }) => Promise<{
    owned: SubCommunityTypeResponse;
    moderated: SubCommunityTypeResponse;
    member: SubCommunityTypeResponse;
  }>;
  // Enqueue a type (or 'all') for scheduled loading. LazySection calls this
  // to ensure its type will be fetched eventually.
  scheduleTypeLoad: (type: string, limit?: number) => Promise<void>;
}

const SubCommunityContext = createContext<SubCommunityContextType>({
  // Default state
  subCommunities: [],
  subCommunitiesByType: [],
  types: [],
  currentSubCommunity: null,
  subCommunityCache: {},
  members: [],
  joinRequests: [],
  creationRequests: [],
  loading: false,
  error: '',
  mySubCommunities: null,
  fetchMySubCommunities: async () => ({
    owned: {
      data: [],
      pagination: {
        page: 1,
        limit: 0,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
      },
    },
    moderated: {
      data: [],
      pagination: {
        page: 1,
        limit: 0,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
      },
    },
    member: {
      data: [],
      pagination: {
        page: 1,
        limit: 0,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
      },
    },
  }),

  // Default actions - all return void
  getAllSubCommunities: async () => {},
  ensureAllSubCommunities: async () => {},
  getSubCommunity: async () => {},
  getSubCommunityByType: async () => ({
    data: [],
    pagination: {
      page: 1,
      limit: 0,
      total: 0,
      totalPages: 0,
      hasNext: false,
      hasPrev: false,
    },
  }),
  ensureTypeLoaded: async () => {},
  loadMoreForType: async () => {},
  scheduleTypeLoad: async () => {},
  createSubCommunity: async () => {},
  updateSubCommunity: async () => {},
  deleteSubCommunity: async () => {},
  requestToJoin: async () => {},
  getPendingJoinRequests: async () => {},
  approveJoinRequest: async () => {},
  leaveSubCommunity: async () => {},
  removeMember: async () => {},
  updateMemberRole: async () => {},
  createSubCommunityRequest: async () => {},
  getAllSubCommunityRequests: async () => {},
  approveSubCommunityRequest: async () => {},
  rejectSubCommunityRequest: async () => {},

  // Default utilities
  setError: () => {},
  clearError: () => {},
  ensureTypes: async () => [],
  isLoadingForType: () => false,
  hasMoreForType: () => false,
  getRemainingForType: () => undefined,
  isAnySectionLoading: () => false,
  sectionLoadInProgress: false,
});

// Simple semaphore to limit concurrent network loads for section fetching.
// Allows a small number of concurrent `getSubCommunityByType` requests to
// avoid bursts when many IntersectionObservers fire together.
class Semaphore {
  private permits: number;
  private queue: Array<() => void> = [];

  constructor(maxConcurrent: number) {
    this.permits = maxConcurrent;
  }

  acquire(): Promise<() => void> {
    return new Promise((resolve) => {
      const tryAcquire = () => {
        if (this.permits > 0) {
          this.permits--;
          resolve(() => {
            this.permits++;
            const next = this.queue.shift();
            if (next) next();
          });
        } else {
          this.queue.push(tryAcquire);
        }
      };
      tryAcquire();
    });
  }
}

export const SubCommunityProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [subCommunities, setSubCommunities] = useState<SubCommunity[]>([]);
  const [subCommunityCache, setSubCommunityCache] = useState<
    Record<string, SubCommunityTypeResponse>
  >({});
  const [currentSubCommunity, setCurrentSubCommunity] =
    useState<SubCommunity | null>(null);
  const [subCommunitiesByType, setSubCommunitiesByType] = useState<
    SubCommunity[]
  >([]);
  const [types, setTypes] = useState<SubCommunityType[]>([]);
  const [members, setMembers] = useState<SubCommunityMember[]>([]);
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const [creationRequests, setCreationRequests] = useState<
    SubCommunityCreationRequest[]
  >([]);
  const [loading, setLoading] = useState(false);
  // When any section-level load is in progress (one at a time due to semaphore)
  // this flag is true. Consumers can use it to block scrolling or show a
  // global skeleton indicator.
  const [sectionLoadInProgress, setSectionLoadInProgress] = useState(false);
  const [error, setErrorState] = useState('');
  // My communities grouped response (owned/moderated/member)
  const [mySubCommunities, setMySubCommunities] = useState<{
    owned: SubCommunityTypeResponse;
    moderated: SubCommunityTypeResponse;
    member: SubCommunityTypeResponse;
  } | null>(null);
  // Idempotent/load guards to avoid duplicate network requests
  const typesFetchPromiseRef = useRef<Promise<SubCommunityType[]> | null>(null);
  const [allLoaded, setAllLoaded] = useState(false);
  const allFetchPromiseRef = useRef<Promise<void> | null>(null);
  // track current loaded page per type and in-flight promises per type+page
  const [subCommunityPages, setSubCommunityPages] = useState<
    Record<string, number>
  >({});
  const inFlightTypePage = useRef<Record<string, Promise<unknown> | null>>({});
  // per-type loading state to trigger re-renders for UI
  const [subCommunityLoadingByType, setSubCommunityLoadingByType] = useState<
    Record<string, boolean>
  >({});

  const { user } = useAuth();

  const setError = useCallback((errorMessage: string) => {
    setErrorState(errorMessage);
  }, []);

  const clearError = useCallback(() => {
    setErrorState('');
  }, []);

  const isAnySectionLoading = useCallback(() => {
    return (
      sectionLoadInProgress ||
      Object.values(subCommunityLoadingByType).some((v) => !!v)
    );
  }, [sectionLoadInProgress, subCommunityLoadingByType]);

  // Semaphore instance to throttle concurrent section loads. Put in a ref
  // so it's stable across renders and not recreated.
  const loadSemaphoreRef = useRef<Semaphore | null>(null);

  if (loadSemaphoreRef.current === null) {
    // set concurrency to 1 for strict sequential section loads
    loadSemaphoreRef.current = new Semaphore(1);
  }

  const safeGetSubCommunityByType = useCallback(
    async (type: string, page: number, limit: number, q?: string) => {
      const release = await loadSemaphoreRef.current!.acquire();
      // mark a section load in progress so UI can block scrolling
      setSectionLoadInProgress(true);
      try {
        return await subCommunityService.getSubCommunityByType(
          type,
          page,
          limit,
          q
        );
      } finally {
        release();
        setSectionLoadInProgress(false);
      }
    },
    []
  );

  const ensureAllSubCommunities = useCallback(
    async (forceRefresh = false) => {
      if (!forceRefresh && allLoaded) return;
      if (allFetchPromiseRef.current) return allFetchPromiseRef.current;
      const p = (async () => {
        // For the main page, fetch compact summaries to save bandwidth
        setLoading(true);
        // Acquire semaphore so 'all' loads are serialized with per-type loads
        const release = await loadSemaphoreRef.current!.acquire();
        try {
          const data = await subCommunityService.getAllSubCommunities({
            compact: true,
            page: 1,
            limit: 6,
          });
          setSubCommunities(data as SubCommunity[]);
          setAllLoaded(true);
        } catch (err: unknown) {
          if (err instanceof Error) {
            setError(err.message || 'Failed to fetch sub-communities');
          } else {
            setError('An unexpected error occurred');
            console.error('Unexpected error:', err);
          }
          throw err;
        } finally {
          release();
          setLoading(false);
          allFetchPromiseRef.current = null;
        }
      })();

      allFetchPromiseRef.current = p;
      return p;
    },
    [allLoaded, setError]
  );

  const getAllSubCommunities = useCallback(async () => {
    // delegate to ensure helper without forcing a refresh
    return ensureAllSubCommunities(false);
  }, [ensureAllSubCommunities]);

  // Idempotent loader for types to avoid duplicate network requests
  const ensureTypes = useCallback(async () => {
    if (types.length > 0) return types;
    if (typesFetchPromiseRef.current) return typesFetchPromiseRef.current;

    const p = (async () => {
      try {
        const t = await subCommunityService.getTypes();
        setTypes(t);
        return t;
      } catch (err) {
        console.warn('Failed to load sub-community types', err);
        throw err;
      } finally {
        typesFetchPromiseRef.current = null;
      }
    })();

    typesFetchPromiseRef.current = p;
    return p;
  }, [types]);

  const getSubCommunity = useCallback(
    async (id: string) => {
      setLoading(true);
      try {
        const data = await subCommunityService.getSubCommunity(id);
        setCurrentSubCommunity(data);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message || 'Failed to fetch sub-community');
        } else {
          setError('An unexpected error occurred');
          console.error('Unexpected error:', err);
        }
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [setError]
  );

  const getSubCommunityByType = useCallback(
    async (
      type: string,
      page: number = 1,
      limit: number = 20,
      q?: string,
      forceRefresh = false
    ) => {
      const cacheKey = `${type}-${page}-${limit}-${q || ''}`;

      // Check cache first
      if (!forceRefresh && subCommunityCache[cacheKey]) {
        const cachedData = subCommunityCache[cacheKey];
        // For specific types, update the byType state
        if (type !== 'all') {
          setSubCommunitiesByType((prev) => {
            // Merge with existing data, avoiding duplicates
            const newData = [...cachedData.data];
            const existingIds = new Set(prev.map((item) => item.id));
            const uniqueNewData = newData.filter(
              (item) => !existingIds.has(item.id)
            );
            return [...prev, ...uniqueNewData];
          });
        }
        return cachedData;
      }

      setLoading(true);
      try {
        const response = await safeGetSubCommunityByType(type, page, limit, q);

        // Update cache
        setSubCommunityCache((prev) => ({
          ...prev,
          [cacheKey]: response,
        }));

        // Update state based on type
        if (type === 'all') {
          setSubCommunities((prev: SubCommunity[]) => {
            // Merge with existing data, avoiding duplicates
            const newData = [...response.data];
            const existingIds = new Set(prev.map((item) => item.id));
            const uniqueNewData = newData.filter(
              (item) => !existingIds.has(item.id)
            );
            return [...prev, ...uniqueNewData];
          });
        } else {
          setSubCommunitiesByType((prev: SubCommunity[]) => {
            // Merge with existing data, avoiding duplicates
            const newData = [...response.data];
            const existingIds = new Set(prev.map((item) => item.id));
            const uniqueNewData = newData.filter(
              (item) => !existingIds.has(item.id)
            );
            return [...prev, ...uniqueNewData];
          });
        }
        return response;
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message || 'Failed to fetch sub-communities by type');
        } else {
          setError('An unexpected error occurred');
          console.error('Unexpected error:', err);
        }
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [setError, subCommunityCache, safeGetSubCommunityByType]
  );

  // Ensure the first page for a given type is loaded (idempotent)
  const ensureTypeLoaded = useCallback(
    async (type: string, limit: number = 6, q?: string): Promise<void> => {
      const key = `${type}-1-${limit}-${q || ''}`;
      if (subCommunityCache[key]) {
        setSubCommunityPages((prev) => ({ ...prev, [type]: 1 }));
        return;
      }
      if (inFlightTypePage.current[key]) {
        // already in-flight; return the existing promise as void
        return inFlightTypePage.current[key] as Promise<void>;
      }

      // set loading for this type so UI can show local spinner
      setSubCommunityLoadingByType((prev) => ({ ...prev, [type]: true }));

      const p: Promise<void> = (async () => {
        try {
          const resp = await getSubCommunityByType(type, 1, limit, q, false);
          if (resp?.data) {
            // mark page 1 loaded
            setSubCommunityPages((prev) => ({ ...prev, [type]: 1 }));
          }
        } finally {
          inFlightTypePage.current[key] = null;
          setSubCommunityLoadingByType((prev) => ({ ...prev, [type]: false }));
        }
      })();

      inFlightTypePage.current[key] = p;
      return p;
    },
    [getSubCommunityByType, subCommunityCache]
  );

  // Load next page for a type (idempotent per target page)
  const loadMoreForType = useCallback(
    async (type: string, limit: number = 6, q?: string): Promise<void> => {
      const current = subCommunityPages[type] ?? 1;
      const next = current + 1;
      const key = `${type}-${next}-${limit}-${q || ''}`;
      if (subCommunityCache[key]) {
        // already loaded
        setSubCommunityPages((prev) => ({ ...prev, [type]: next }));
        return;
      }
      if (inFlightTypePage.current[key]) {
        return inFlightTypePage.current[key] as Promise<void>;
      }

      setSubCommunityLoadingByType((prev) => ({ ...prev, [type]: true }));

      const p: Promise<void> = (async () => {
        try {
          const resp = await getSubCommunityByType(type, next, limit, q, false);
          if (resp?.data) {
            setSubCommunityPages((prev) => ({ ...prev, [type]: next }));
          }
        } finally {
          inFlightTypePage.current[key] = null;
          setSubCommunityLoadingByType((prev) => ({ ...prev, [type]: false }));
        }
      })();

      inFlightTypePage.current[key] = p;
      return p;
    },
    [getSubCommunityByType, subCommunityPages, subCommunityCache]
  );

  const isLoadingForType = useCallback(
    (type: string) => {
      return !!subCommunityLoadingByType[type];
    },
    [subCommunityLoadingByType]
  );

  const hasMoreForType = useCallback(
    (type: string, limit: number = 6, q: string = '') => {
      const page = subCommunityPages[type] ?? 1;
      const key = `${type}-${page}-${limit}-${q}`;
      const resp = subCommunityCache[key];
      return !!resp?.pagination?.hasNext;
    },
    [subCommunityPages, subCommunityCache]
  );

  const getRemainingForType = useCallback(
    (type: string, limit: number = 6, q: string = ''): number | undefined => {
      // Sum loaded items for this type across cached pages
      const loadedKeys = Object.keys(subCommunityCache).filter((k) =>
        k.startsWith(`${type}-`)
      );
      const loadedCount = loadedKeys.reduce((acc, k) => {
        const resp = subCommunityCache[k];
        return acc + (resp?.data?.length ?? 0);
      }, 0);

      // try to read total from the latest page we have (prefer current page)
      const currentPage = subCommunityPages[type] ?? 1;
      const currentKey = `${type}-${currentPage}-${limit}-${q}`;
      // fallback to any page for this type
      const fallbackKey = loadedKeys[loadedKeys.length - 1];
      const currentResp =
        subCommunityCache[currentKey] ?? subCommunityCache[fallbackKey];

      const total = currentResp?.pagination?.total;
      if (typeof total === 'number') {
        return Math.max(0, total - loadedCount);
      }
      return undefined;
    },
    [subCommunityCache, subCommunityPages]
  );

  // A small queue to ensure scheduled section loads are eventually processed.
  // LazySection components enqueue their type id here; the queue processor
  // will call `ensureTypeLoaded` (or `ensureAllSubCommunities`) sequentially
  // so no scheduled load is dropped due to transient flags.
  const scheduledQueueRef = useRef<string[]>([]);
  const queueProcessingRef = useRef(false);

  const scheduleTypeLoad = useCallback(
    async (type: string, limit = 6) => {
      // Avoid enqueueing duplicates
      if (scheduledQueueRef.current.includes(type)) return;

      scheduledQueueRef.current.push(type);

      // Kick off processor if not already running
      if (queueProcessingRef.current) return;

      queueProcessingRef.current = true;
      try {
        while (scheduledQueueRef.current.length > 0) {
          const next = scheduledQueueRef.current.shift()!;
          try {
            if (next === 'all') {
              // Ensure 'all' loads use the compact loader
              // Acquire semaphore inside ensureAllSubCommunities
              await ensureAllSubCommunities();
            } else {
              await ensureTypeLoaded(next, limit);
            }
          } catch (err) {
            // swallow and continue; retry logic is handled by the enqueuing
            // source (LazySection will re-enqueue if necessary)
            console.warn('Scheduled load failed for', next, err);
          }
          // small delay to avoid immediate bursts

          await new Promise((r) => setTimeout(r, 50));
        }
      } finally {
        queueProcessingRef.current = false;
      }
    },
    [ensureAllSubCommunities, ensureTypeLoaded]
  );

  // NOTE: removed auto-fetch on mount. Consumers should call `ensureTypes()`
  // or `ensureAllSubCommunities()` from their own lifecycle (pages/components)

  const createSubCommunity = useCallback(
    async (data: {
      name: string;
      description: string;
      isPrivate: boolean;
      ownerId: string;
    }) => {
      setLoading(true);
      try {
        const newSubCommunity =
          await subCommunityService.createSubCommunity(data);
        setSubCommunities((prev: SubCommunity[]) => [...prev, newSubCommunity]);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message || 'Failed to create sub-community');
        } else {
          setError('Failed to create sub-community');
        }
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [setError]
  );

  const updateSubCommunity = useCallback(
    async (id: string, data: UpdateSubCommunityDto) => {
      setLoading(true);
      try {
        const updated = await subCommunityService.updateSubCommunity(id, data);
        setSubCommunities((prev: SubCommunity[]) =>
          prev.map((sc: SubCommunity) => (sc.id === id ? updated : sc))
        );
        setCurrentSubCommunity((prev: SubCommunity | null) =>
          prev?.id === id ? updated : prev
        );
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message || 'Failed to update sub-community');
        } else {
          setError('Failed to update sub-community');
        }
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [setError]
  );

  const deleteSubCommunity = useCallback(
    async (id: string) => {
      setLoading(true);
      try {
        await subCommunityService.deleteSubCommunity(id);
        setSubCommunities((prev: SubCommunity[]) =>
          prev.filter((sc: SubCommunity) => sc.id !== id)
        );
        setCurrentSubCommunity((prev: SubCommunity | null) =>
          prev?.id === id ? null : prev
        );
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message || 'Failed to delete sub-community');
        } else {
          setError('Failed to delete sub-community');
        }
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [setError]
  );

  const requestToJoin = useCallback(
    async (subCommunityId: string) => {
      setLoading(true);
      try {
        const joinRequest =
          await subCommunityService.requestToJoin(subCommunityId);
        setJoinRequests((prev: JoinRequest[]) => [...prev, joinRequest]);
      } catch (err: unknown) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    },
    [setError]
  );

  const getPendingJoinRequests = useCallback(
    async (subCommunityId: string) => {
      setLoading(true);
      try {
        const requests =
          await subCommunityService.getPendingJoinRequests(subCommunityId);
        setJoinRequests(requests);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message || 'Failed to fetch join requests');
        } else {
          setError('Failed to fetch join requests');
        }
      } finally {
        setLoading(false);
      }
    },
    [setError]
  );

  const approveJoinRequest = useCallback(
    async (
      subCommunityId: string,
      joinRequestId: string,
      dto: ApproveJoinRequestDto
    ) => {
      setLoading(true);
      try {
        const updated = await subCommunityService.approveJoinRequest(
          subCommunityId,
          joinRequestId,
          dto
        );
        // Merge updated fields onto existing request to preserve related
        // nested data (e.g. `user`) when the backend response omits it.
        setJoinRequests((prev: JoinRequest[]) =>
          prev.map((jr: JoinRequest) =>
            jr.id === joinRequestId ? { ...jr, ...updated } : jr
          )
        );
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message || 'Failed to approve join request');
        } else {
          setError('Failed to approve join request');
        }
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [setError]
  );

  const leaveSubCommunity = useCallback(
    async (subCommunityId: string) => {
      setLoading(true);
      try {
        await subCommunityService.leaveSubCommunity(subCommunityId);
        setMembers((prev: SubCommunityMember[]) =>
          prev.filter((m: SubCommunityMember) => m.userId !== user?.id)
        );
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message || 'Failed to leave sub-community');
        } else {
          setError('Failed to leave sub-community');
        }
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [user, setError]
  );

  const removeMember = useCallback(
    async (subCommunityId: string, memberId: string) => {
      setLoading(true);
      try {
        await subCommunityService.removeMember(subCommunityId, memberId);
        setMembers((prev: SubCommunityMember[]) =>
          prev.filter((m: SubCommunityMember) => m.userId !== memberId)
        );
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message || 'Failed to remove member');
        } else {
          setError('Failed to remove member');
        }
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [setError]
  );

  const updateMemberRole = useCallback(
    async (
      subCommunityId: string,
      memberId: string,
      role: SubCommunityRole
    ) => {
      setLoading(true);
      try {
        const updated = await subCommunityService.updateMemberRole(
          subCommunityId,
          memberId,
          { role }
        );
        setMembers((prev: SubCommunityMember[]) =>
          prev.map((m: SubCommunityMember) =>
            m.id === updated.id ? updated : m
          )
        );
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message || 'Failed to update member role');
        } else {
          setError('Failed to update member role');
        }
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [setError]
  );

  const createSubCommunityRequest = useCallback(
    async (dto: CreateSubCommunityRequestDto) => {
      setLoading(true);
      try {
        const request =
          await subCommunityService.createSubCommunityRequest(dto);
        setCreationRequests((prev: SubCommunityCreationRequest[]) => [
          ...prev,
          request,
        ]);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message || 'Failed to create sub-community request');
        } else {
          setError('Failed to create sub-community request');
        }
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [setError]
  );

  const getAllSubCommunityRequests = useCallback(async () => {
    setLoading(true);
    try {
      const requests = await subCommunityService.getAllSubCommunityRequests();
      setCreationRequests(requests);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || 'Failed to fetch sub-community requests');
      } else {
        setError('Failed to fetch sub-community requests');
      }
    } finally {
      setLoading(false);
    }
  }, [setError]);

  const approveSubCommunityRequest = useCallback(
    async (requestId: string) => {
      setLoading(true);
      try {
        const updated =
          await subCommunityService.approveSubCommunityRequest(requestId);
        setCreationRequests((prev: SubCommunityCreationRequest[]) =>
          prev.map((cr: SubCommunityCreationRequest) =>
            cr.id === requestId ? updated : cr
          )
        );
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message || 'Failed to approve sub-community request');
        } else {
          setError('Failed to approve sub-community request');
        }
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [setError]
  );

  const rejectSubCommunityRequest = useCallback(
    async (requestId: string) => {
      setLoading(true);
      try {
        const updated =
          await subCommunityService.rejectSubCommunityRequest(requestId);
        setCreationRequests((prev: SubCommunityCreationRequest[]) =>
          prev.map((cr: SubCommunityCreationRequest) =>
            cr.id === requestId ? updated : cr
          )
        );
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message || 'Failed to reject sub-community request');
        } else {
          setError('Failed to reject sub-community request');
        }
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [setError]
  );

  const fetchMySubCommunities = useCallback(
    async (opts?: {
      ownedPage?: number;
      ownedLimit?: number;
      moderatedPage?: number;
      moderatedLimit?: number;
      memberPage?: number;
      memberLimit?: number;
    }) => {
      setLoading(true);
      // serialize with other section loads to avoid concurrent network bursts
      const release = await loadSemaphoreRef.current!.acquire();
      setSectionLoadInProgress(true);
      try {
        // Instead of fetching all categories in parallel, only fetch the
        // categories requested in `opts`. If no opts provided, default to
        // fetching the 'owned' category only. Calls are performed
        // sequentially to ensure one-at-a-time behavior.
        const defaultEmpty = {
          data: [],
          pagination: {
            page: 1,
            limit: 0,
            total: 0,
            totalPages: 0,
            hasNext: false,
            hasPrev: false,
          },
        } as SubCommunityTypeResponse;

        let ownedResp: SubCommunityTypeResponse | undefined;
        let moderatedResp: SubCommunityTypeResponse | undefined;
        let memberResp: SubCommunityTypeResponse | undefined;

        const shouldFetchOwned =
          !opts ||
          opts.ownedPage !== undefined ||
          opts.ownedLimit !== undefined;
        const shouldFetchModerated =
          opts?.moderatedPage !== undefined ||
          opts?.moderatedLimit !== undefined;
        const shouldFetchMember =
          opts?.memberPage !== undefined || opts?.memberLimit !== undefined;

        // If no explicit category opts were passed, default to owned only.
        if (shouldFetchOwned) {
          ownedResp = await subCommunityService.getMyOwnedSubCommunities(
            opts?.ownedPage ?? 1,
            opts?.ownedLimit ?? 6
          );
        }

        console.log(ownedResp);

        if (shouldFetchModerated) {
          moderatedResp =
            await subCommunityService.getMyModeratedSubCommunities(
              opts?.moderatedPage ?? 1,
              opts?.moderatedLimit ?? 6
            );
        }

        if (shouldFetchMember) {
          memberResp = await subCommunityService.getMyMemberSubCommunities(
            opts?.memberPage ?? 1,
            opts?.memberLimit ?? 6
          );
        }

        // Merge with any existing state so we don't clobber categories that
        // weren't requested by the caller.
        const combined = ((prev) => {
          const existing = prev ?? {
            owned: defaultEmpty,
            moderated: defaultEmpty,
            member: defaultEmpty,
          };
          return {
            owned: ownedResp ?? existing.owned ?? defaultEmpty,
            moderated: moderatedResp ?? existing.moderated ?? defaultEmpty,
            member: memberResp ?? existing.member ?? defaultEmpty,
          };
        })(mySubCommunities);

        setMySubCommunities(combined);
        return combined;
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message || 'Failed to fetch my sub-communities');
        } else {
          setError('Failed to fetch my sub-communities');
        }
        throw err;
      } finally {
        release();
        setLoading(false);
        setSectionLoadInProgress(false);
      }
    },
    [setError, mySubCommunities]
  );

  // Load initial data moved to consumers; use `ensureAllSubCommunities()` instead

  const contextValue = useMemo(
    () => ({
      // State
      subCommunities,
      subCommunitiesByType,
      subCommunityCache,
      currentSubCommunity,
      members,
      joinRequests,
      creationRequests,
      loading,
      error,

      // Actions
      getAllSubCommunities,
      getSubCommunity,
      getSubCommunityByType,
      createSubCommunity,
      updateSubCommunity,
      deleteSubCommunity,
      requestToJoin,
      getPendingJoinRequests,
      approveJoinRequest,
      leaveSubCommunity,
      removeMember,
      updateMemberRole,
      createSubCommunityRequest,
      getAllSubCommunityRequests,
      approveSubCommunityRequest,
      rejectSubCommunityRequest,

      // types
      types,
      // idempotent loaders
      ensureAllSubCommunities,
      ensureTypes,
      ensureTypeLoaded,
      loadMoreForType,
      isLoadingForType,
      hasMoreForType,
      getRemainingForType,

      sectionLoadInProgress,
      isAnySectionLoading,

      // my communities
      mySubCommunities,
      fetchMySubCommunities,
      // scheduling
      scheduleTypeLoad,

      // Utilities
      setError,
      clearError,
    }),
    [
      subCommunities,
      subCommunitiesByType,
      subCommunityCache,
      currentSubCommunity,
      members,
      joinRequests,
      creationRequests,
      loading,
      error,
      getAllSubCommunities,
      getSubCommunity,
      getSubCommunityByType,
      createSubCommunity,
      updateSubCommunity,
      deleteSubCommunity,
      requestToJoin,
      getPendingJoinRequests,
      approveJoinRequest,
      leaveSubCommunity,
      removeMember,
      updateMemberRole,
      createSubCommunityRequest,
      getAllSubCommunityRequests,
      approveSubCommunityRequest,
      rejectSubCommunityRequest,
      types,
      ensureAllSubCommunities,
      ensureTypes,
      ensureTypeLoaded,
      loadMoreForType,
      isLoadingForType,
      isAnySectionLoading,
      hasMoreForType,
      getRemainingForType,
      sectionLoadInProgress,
      mySubCommunities,
      fetchMySubCommunities,
      scheduleTypeLoad,
      setError,
      clearError,
    ]
  );

  return (
    <SubCommunityContext.Provider value={contextValue}>
      {children}
    </SubCommunityContext.Provider>
  );
};

export const useSubCommunity = () => {
  const context = useContext(SubCommunityContext);
  if (!context) {
    throw new Error(
      'useSubCommunity must be used within a SubCommunityProvider'
    );
  }
  return context;
};
