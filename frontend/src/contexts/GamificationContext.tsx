import {
  FC,
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import gamificationService from '../services/gamificationService';

type LeaderboardItem = {
  userId: string;
  points: number;
};

type Transaction = {
  id: string;
  userId: string;
  points: number;
  type: string;
  message?: string;
  entityId?: string | null;
  createdAt: string;
};

type GamificationState = {
  leaderboard: LeaderboardItem[];
  userPoints: number | null;
  transactions: Transaction[];
  loading: boolean;
  loadLeaderboard: (
    period?: 'day' | 'week' | 'month' | 'all',
    force?: boolean
  ) => Promise<void>;
  loadUserPoints: (userId: string, force?: boolean) => Promise<void>;
  loadTransactions: (userId: string, force?: boolean) => Promise<void>;
  clearCache: () => void;
};

const defaultState: GamificationState = {
  leaderboard: [],
  userPoints: null,
  transactions: [],
  loading: false,
  loadLeaderboard: async () => {},
  loadUserPoints: async () => {},
  loadTransactions: async () => {},
  clearCache: () => {},
};

const CACHE_KEY = 'nexus_gamification_cache_v2';

type CachedEntry<T> = {
  ts: number;
  data: T;
};

type GamificationCache = {
  leaderboards?: Record<string, CachedEntry<LeaderboardItem[]>>;
  userPoints?: Record<string, CachedEntry<number>>;
  transactions?: Record<string, CachedEntry<Transaction[]>>;
};

const GamificationContext = createContext<GamificationState>(defaultState);

export const useGamification = () => useContext(GamificationContext);

// (Per-key read/write helpers implemented inside provider)

export const GamificationProvider: FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardItem[]>([]);
  const [userPoints, setUserPoints] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const memoryCacheRef = useRef<Record<string, { ts: number; data: unknown }>>(
    {}
  );
  const inFlightRef = useRef<Record<string, Promise<unknown> | null>>({});

  const TTL = {
    leaderboard: 2 * 60 * 1000, // 2 minutes
    userPoints: 2 * 60 * 1000,
    transactions: 2 * 60 * 1000,
  } as const;

  // helper: read cache for a specific key
  function readCacheKey<T>(key: string, maxAge: number): T | null {
    const mem = memoryCacheRef.current[key];
    const now = Date.now();
    if (mem && now - mem.ts < maxAge) return mem.data as T;

    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as GamificationCache;
      // leaderboards keyed separately
      const lbBucket = parsed.leaderboards as unknown as
        | Record<string, CachedEntry<T>>
        | undefined;
      if (lbBucket && lbBucket[key]) {
        const entry = lbBucket[key] as CachedEntry<T>;
        if (now - entry.ts < maxAge) {
          memoryCacheRef.current[key] = { ts: entry.ts, data: entry.data };
          return entry.data;
        }
        return null;
      }
      // userPoints
      const upBucket = parsed.userPoints as unknown as
        | Record<string, CachedEntry<T>>
        | undefined;
      if (upBucket && upBucket[key]) {
        const entry = upBucket[key] as CachedEntry<T>;
        if (now - entry.ts < maxAge) {
          memoryCacheRef.current[key] = { ts: entry.ts, data: entry.data };
          return entry.data;
        }
        return null;
      }
      // transactions
      const txBucket = parsed.transactions as unknown as
        | Record<string, CachedEntry<T>>
        | undefined;
      if (txBucket && txBucket[key]) {
        const entry = txBucket[key] as CachedEntry<T>;
        if (now - entry.ts < maxAge) {
          memoryCacheRef.current[key] = { ts: entry.ts, data: entry.data };
          return entry.data;
        }
        return null;
      }
      return null;
    } catch {
      try {
        localStorage.removeItem(CACHE_KEY);
      } catch (rmErr) {
        console.warn('Failed clearing corrupted gamification cache', rmErr);
      }
      return null;
    }
  }

  function writeCacheKey<T>(key: string, data: T) {
    const now = Date.now();
    memoryCacheRef.current[key] = { ts: now, data };
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      const parsed = raw ? (JSON.parse(raw) as GamificationCache) : {};
      // Determine bucket by key prefix
      if (key.startsWith('leaderboard:')) {
        parsed.leaderboards = parsed.leaderboards || {};
        const lb = parsed.leaderboards as Record<
          string,
          CachedEntry<LeaderboardItem[]>
        >;
        lb[key] = { ts: now, data: data as unknown as LeaderboardItem[] };
        parsed.leaderboards = lb;
      } else if (key.startsWith('userPoints:')) {
        parsed.userPoints = parsed.userPoints || {};
        const up = parsed.userPoints as Record<string, CachedEntry<number>>;
        up[key] = { ts: now, data: data as unknown as number };
        parsed.userPoints = up;
      } else if (key.startsWith('transactions:')) {
        parsed.transactions = parsed.transactions || {};
        const tx = parsed.transactions as Record<
          string,
          CachedEntry<Transaction[]>
        >;
        tx[key] = { ts: now, data: data as unknown as Transaction[] };
        parsed.transactions = tx;
      }
      localStorage.setItem(CACHE_KEY, JSON.stringify(parsed));
    } catch (e) {
      console.warn('Failed to write gamification cache to localStorage', e);
    }
  }

  // initialize from cache on mount (load default leaderboard if present)
  useEffect(() => {
    const defaultKey = `leaderboard:week:8`;
    const cached = readCacheKey<LeaderboardItem[]>(defaultKey, TTL.leaderboard);
    if (cached) setLeaderboard(cached);
    // no-op for userPoints/transactions until requested
  }, [TTL.leaderboard]);

  async function loadLeaderboard(
    period: 'day' | 'week' | 'month' | 'all' = 'all',
    force = false,
    limit = 8
  ) {
    const key = `leaderboard:${period}:${limit}`;
    setLoading(true);
    try {
      if (!force) {
        const cached = readCacheKey<LeaderboardItem[]>(key, TTL.leaderboard);
        if (cached) {
          setLeaderboard(cached);
          setLoading(false);
          return;
        }
      }

      // dedupe concurrent calls
      if (inFlightRef.current[key]) {
        try {
          await inFlightRef.current[key];
        } catch (err) {
          console.debug('in-flight leaderboard error', err);
        }
        const again = readCacheKey<LeaderboardItem[]>(key, TTL.leaderboard);
        if (again) setLeaderboard(again);
        setLoading(false);
        return;
      }

      const promise = (async () => {
        const res = await gamificationService.getLeaderboard(period, limit);
        const lb = res?.data ?? [];
        setLeaderboard(lb);
        writeCacheKey<LeaderboardItem[]>(key, lb);
      })();

      inFlightRef.current[key] = promise;
      try {
        await promise;
      } finally {
        inFlightRef.current[key] = null;
      }
    } catch (e) {
      console.error('Failed to load leaderboard', e);
    } finally {
      setLoading(false);
    }
  }

  async function loadUserPoints(userId: string, force = false) {
    const key = `userPoints:${userId}`;
    setLoading(true);
    try {
      if (!force) {
        const cached = readCacheKey<number>(key, TTL.userPoints);
        if (typeof cached === 'number') {
          setUserPoints(cached);
          setLoading(false);
          return;
        }
      }

      if (inFlightRef.current[key]) {
        try {
          await inFlightRef.current[key];
        } catch (err) {
          console.debug('in-flight userPoints error', err);
        }
        const again = readCacheKey<number>(key, TTL.userPoints);
        if (typeof again === 'number') setUserPoints(again);
        setLoading(false);
        return;
      }

      const promise = (async () => {
        const res = await gamificationService.getUserPoints(userId);
        const points = res?.points ?? 0;
        setUserPoints(points);
        writeCacheKey<number>(key, points);
      })();

      inFlightRef.current[key] = promise;
      try {
        await promise;
      } finally {
        inFlightRef.current[key] = null;
      }
    } catch (e) {
      console.error('Failed to load user points', e);
    } finally {
      setLoading(false);
    }
  }

  async function loadTransactions(userId: string, force = false) {
    const key = `transactions:${userId}`;
    setLoading(true);
    try {
      if (!force) {
        const cached = readCacheKey<Transaction[]>(key, TTL.transactions);
        if (cached) {
          setTransactions(cached);
          setLoading(false);
          return;
        }
      }

      if (inFlightRef.current[key]) {
        try {
          await inFlightRef.current[key];
        } catch (err) {
          console.debug('in-flight transactions error', err);
        }
        const again = readCacheKey<Transaction[]>(key, TTL.transactions);
        if (again) setTransactions(again);
        setLoading(false);
        return;
      }

      const promise = (async () => {
        const res = await gamificationService.getTransactions(userId);
        const tx = res.data || [];
        setTransactions(tx);
        writeCacheKey<Transaction[]>(key, tx);
      })();

      inFlightRef.current[key] = promise;
      try {
        await promise;
      } finally {
        inFlightRef.current[key] = null;
      }
    } catch (e) {
      console.error('Failed to load transactions', e);
    } finally {
      setLoading(false);
    }
  }

  function clearCache() {
    try {
      localStorage.removeItem(CACHE_KEY);
      setLeaderboard([]);
      setUserPoints(null);
      setTransactions([]);
    } catch (e) {
      console.warn('Failed to clear gamification cache', e);
    }
  }

  const value: GamificationState = {
    leaderboard,
    userPoints,
    transactions,
    loading,
    loadLeaderboard,
    loadUserPoints,
    loadTransactions,
    clearCache,
  };

  return (
    <GamificationContext.Provider value={value}>
      {children}
    </GamificationContext.Provider>
  );
};

export default GamificationContext;
