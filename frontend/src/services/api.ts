import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

type RefreshAuthResponse = {
  accessToken?: string;
};

let apiAccessToken: string | null = null;

export const setApiAccessToken = (token: string | null) => {
  apiAccessToken = token;
};

export const getApiAccessToken = () => apiAccessToken;
export const isAxiosError = axios.isAxiosError;

// Create axios instance with default config
const api: AxiosInstance = axios.create({
  baseURL: BACKEND_URL,
  timeout: 10000,
  // withCredentials sends httpOnly cookies automatically with every request.
  // This is required for the cookie-based JWT auth migration (Issue #164).
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Simple in-memory cache for GET responses (per-session, per-user)
type MemoryCacheEntry = { data: unknown; ts: number; ttl: number };
const memoryCache = new Map<string, MemoryCacheEntry>();

const getUserCacheKeyPart = () => {
  try {
    const userRaw = localStorage.getItem('user');
    if (!userRaw) return 'anon';
    const user = JSON.parse(userRaw);
    return `${user?.id || 'anon'}:${user?.role || 'UNKNOWN'}`;
  } catch {
    return 'anon';
  }
};

function cacheGetOrFetch<T>(
  key: string,
  fetcher: () => Promise<AxiosResponse<T>>,
  ttlMs = 30000
): Promise<AxiosResponse<T>> {
  const now = Date.now();
  const entry = memoryCache.get(key) as
    | (MemoryCacheEntry & { data: T })
    | undefined;
  if (entry && now - entry.ts < entry.ttl) {
    return Promise.resolve({ data: entry.data } as AxiosResponse<T>);
  }
  return fetcher().then((resp) => {
    memoryCache.set(key, { data: resp.data as T, ts: now, ttl: ttlMs });
    return resp;
  });
}

// Request interceptor: attach CSRF token for mutating requests (Issue #162).
// Auth token is managed in-memory through setApiAccessToken (Issue #175).
api.interceptors.request.use(
  (config) => {
    // Read the CSRF token from the non-httpOnly cookie set by the backend.
    const csrfToken = document.cookie
      .split('; ')
      .find((row) => row.startsWith('csrf-token='))
      ?.split('=')[1];

    config.headers = config.headers ?? {};

    if (apiAccessToken) {
      config.headers.Authorization = `Bearer ${apiAccessToken}`;
    }

    if (csrfToken && config.headers) {
      config.headers['X-CSRF-Token'] = csrfToken;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as
      | (AxiosError['config'] & { _retry?: boolean })
      | undefined;
    const status = error.response?.status;
    const requestUrl = originalRequest?.url ?? 'unknown';
    const method = (originalRequest?.method ?? 'get').toUpperCase();

    if (status === 401) {
      console.error('[Auth] 401 response intercepted', {
        method,
        url: requestUrl,
        status,
        data: error.response?.data,
      });

      const isAuthEndpoint =
        requestUrl.includes('/auth/login') ||
        requestUrl.includes('/auth/register') ||
        requestUrl.includes('/auth/refresh') ||
        requestUrl.includes('/auth/logout');

      // For auth endpoints, let callers handle 401 (avoid forced redirects
      // during session restore/login/logout flows).
      if (isAuthEndpoint) {
        return Promise.reject(error);
      }

      if (originalRequest && !originalRequest._retry) {
        originalRequest._retry = true;
        try {
          const refreshResponse = await axios.post<RefreshAuthResponse>(
            '/auth/refresh',
            {},
            {
              baseURL: BACKEND_URL,
              withCredentials: true,
              headers: {
                'Content-Type': 'application/json',
              },
            }
          );

          if (refreshResponse.data?.accessToken) {
            setApiAccessToken(refreshResponse.data.accessToken);
          }

          return api(originalRequest);
        } catch (refreshError) {
          console.error('[Auth] Refresh attempt failed', refreshError);
        }
      }

      localStorage.removeItem('user');
      setApiAccessToken(null);
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

// API service methods
export const apiService = {
  // Auth endpoints
  auth: {
    login: (email: string, password: string) =>
      api.post('/auth/login', { email, password }),
    register: (email: string, password: string, name: string, role: string) =>
      api.post('/auth/register', { email, password, name, role }),
    test: () => api.get('/auth/test'),
  },

  // User endpoints
  users: {
    getAll: () => api.get('/users'),
    getById: (id: string) => api.get(`/users/${id}`),
    update: (id: string, data: unknown) => api.patch(`/users/${id}`, data),
    delete: (id: string) => api.delete(`/users/${id}`),
    search: (query: string) =>
      api.get(`/users/search?q=${encodeURIComponent(query)}`),
  },

  // Profile endpoints
  profile: {
    get: (userId: string) => api.get(`/profile/${userId}`),
    update: (userId: string, data: unknown) =>
      api.put(`/profile/${userId}`, data),
  },

  // Connection endpoints
  connections: {
    getAll: ({
      page,
      limit,
      role,
      search,
    }: {
      page: number;
      limit: number;
      role?: 'STUDENT' | 'ALUM' | 'ADMIN';
      search?: string;
    }) => {
      const key = `connections:getAll:${getUserCacheKeyPart()}:${page}:${limit}:${role || ''}:${search || ''}`;
      return cacheGetOrFetch(
        key,
        () => api.get('/connection', { params: { page, limit, role, search } }),
        20000
      );
    },
    getStats: () => {
      const key = `connections:stats:${getUserCacheKeyPart()}`;
      return cacheGetOrFetch(key, () => api.get('/connection/stats'), 20000);
    },
    getPendingReceived: ({ page, limit }: { page: number; limit: number }) => {
      const key = `connections:pendingReceived:${getUserCacheKeyPart()}:${page}:${limit}`;
      return cacheGetOrFetch(
        key,
        () =>
          api.get('/connection/pending/received', { params: { page, limit } }),
        20000
      );
    },
    getPendingSent: ({ page, limit }: { page: number; limit: number }) => {
      const key = `connections:pendingSent:${getUserCacheKeyPart()}:${page}:${limit}`;
      return cacheGetOrFetch(
        key,
        () => api.get('/connection/pending/sent', { params: { page, limit } }),
        20000
      );
    },
    getStatus: (userId: string) => {
      const key = `connections:status:${getUserCacheKeyPart()}:${userId}`;
      return cacheGetOrFetch(
        key,
        () => api.get(`/connection/status/${userId}`),
        20000
      );
    },
    getSuggestions: ({ limit }: { limit: number }) => {
      const key = `connections:suggestions:${getUserCacheKeyPart()}:${limit}`;
      return cacheGetOrFetch(
        key,
        () => api.get('/connection/suggestions', { params: { limit } }),
        20000
      );
    },
    send: (recipientId: string) =>
      api.post('/connection/send', { recipientId }),
    updateStatus: (connectionId: string, status: string) =>
      api.patch('/connection/status', { connectionId, status }),
    cancel: (connectionId: string) =>
      api.delete(`/connection/cancel/${connectionId}`),
    remove: (connectionId: string) =>
      api.delete(`/connection/remove/${connectionId}`),
    prefetch: (limit: number = 10) => {
      // Warm up common queries for instant navigation
      return Promise.allSettled([
        apiService.connections.getAll({
          page: 1,
          limit,
          role: undefined,
          search: undefined,
        }),
        apiService.connections.getStats(),
        apiService.connections.getPendingReceived({ page: 1, limit }),
        apiService.connections.getPendingSent({ page: 1, limit }),
        apiService.connections.getSuggestions({ limit }),
      ]);
    },
  },

  // Message endpoints
  messages: {
    send: (content: string, receiverId: string) =>
      api.post('/messages', { content, receiverId }),
    getConversation: (
      otherUserId: string,
      params?: { skip?: number; take?: number }
    ) => {
      const queryParams = params
        ? `?skip=${params.skip || 0}&take=${params.take || 20}`
        : '';
      return api.get(`/messages/conversation/${otherUserId}${queryParams}`);
    },
    getAllConversations: () => api.get('/messages/conversations/all'),
  },

  // Referral endpoints
  referrals: {
    create: (data: unknown) => api.post('/referral', data),
    // Cached list fetch with short TTL for snap navigation
    getAll: (opts?: { force?: boolean }) => {
      const key = `referrals:list:${getUserCacheKeyPart()}`;
      if (opts?.force) memoryCache.delete(key);
      return cacheGetOrFetch(key, () => api.get('/referral'), 30000);
    },
    prefetch: () => {
      const key = `referrals:list:${getUserCacheKeyPart()}`;
      return cacheGetOrFetch(key, () => api.get('/referral'), 30000).catch(
        () => undefined
      );
    },
    getById: (id: string) => api.get(`/referral/${id}`),
    update: (id: string, data: unknown) => api.put(`/referral/${id}`, data),
    delete: (id: string) => api.delete(`/referral/${id}`),
    approve: (id: string) => api.put(`/referral/${id}/approve`),
    reject: (id: string) => api.put(`/referral/${id}/reject`),
    // Applications now expect JSON body with resumeUrl (Drive link)
    apply: (data: {
      referralId: string;
      resumeUrl: string;
      coverLetter?: string;
    }) => api.post('/referral/apply', data),
    getApplications: (referralId: string) =>
      api.get(`/referral/${referralId}/applications`),
    getAllApplications: () => api.get('/referral/applications'),
    updateApplicationStatus: (id: string, status: string) =>
      api.put(`/referral/applications/${id}/status`, { status }),
    getMyApplications: () => api.get('/referral/applications/my'),
    getAnalytics: () => api.get('/referral/analytics'),
  },

  // Files endpoints
  files: {
    upload: (formData: FormData) => api.post('/files/upload', formData),
    getAll: (accessToken?: string, refreshToken?: string) =>
      api.get(
        `/files${accessToken ? `?access_token=${accessToken}${refreshToken ? `&refresh_token=${refreshToken}` : ''}` : ''}`
      ),
    getById: (id: string) => api.get(`/files/${id}`),
    delete: (id: string, body?: unknown) =>
      api.delete(`/files/${id}`, { data: body }),
    download: (id: string) => api.get(`/files/${id}/download`),
    getDownloadUrl: (id: string, accessToken: string, refreshToken?: string) =>
      api.get(
        `/files/${id}/download?access_token=${accessToken}${refreshToken ? `&refresh_token=${refreshToken}` : ''}`
      ),
    share: (
      id: string,
      userEmail: string,
      accessToken: string,
      refreshToken?: string
    ) =>
      api.post(`/files/${id}/share`, {
        userEmail,
        access_token: accessToken,
        refresh_token: refreshToken,
      }),
    getGoogleAuthUrl: () => api.get('/files/auth/google'),
    handleGoogleCallback: (code: string) =>
      api.post('/files/auth/google/callback', { code }),
    refreshGoogleToken: (refreshToken: string) =>
      api.post('/files/auth/google/refresh', { refresh_token: refreshToken }),
    validateGoogleTokens: (tokens: {
      access_token: string;
      refresh_token?: string;
    }) => api.post('/files/auth/google/validate', tokens),
  },

  // Post endpoints
  posts: {
    create: (userId: string, data: unknown) =>
      api.post(`/posts/${userId}`, data),
    getAll: (opts?: { force?: boolean }) => {
      const key = `posts:all:${getUserCacheKeyPart()}`;
      if (opts?.force) memoryCache.delete(key);
      return cacheGetOrFetch(key, () => api.get('/posts'), 20000);
    },
    getByUser: (userId: string) => api.get(`/posts/user/${userId}`),
    update: (id: string, userId: string, data: unknown) =>
      api.patch(`/posts/${id}/user/${userId}`, data),
    delete: (id: string, userId: string) =>
      api.delete(`/posts/${id}/user/${userId}`),
    prefetch: () =>
      cacheGetOrFetch(
        `posts:all:${getUserCacheKeyPart()}`,
        () => api.get('/posts'),
        20000
      ).catch(() => undefined),
  },

  // Engagement endpoints
  engagement: {
    like: (postId: string) => api.post(`/engagement/${postId}/like`),
    unlike: (postId: string) => api.delete(`/engagement/${postId}/unlike`),
    comment: (postId: string, content: string) =>
      api.post(`/engagement/${postId}/comment`, { content }),
    getFeed: () => api.get('/engagement/feed'),
  },

  // Notification endpoints
  notifications: {
    create: (data: unknown) => api.post('/notifications', data),
    getAll: () => api.get('/notifications'),
    getUnreadCount: () => api.get('/notifications/count/unread'),
    getStats: () => api.get('/notifications/stats'),
    markAsRead: (id: string) => api.patch(`/notifications/${id}/read`),
    markAsUnread: (id: string) => api.patch(`/notifications/${id}/unread`),
    markAllAsRead: () => api.patch('/notifications/read/all'),
    delete: (id: string) => api.delete(`/notifications/${id}`),
    deleteAllRead: () => api.delete('/notifications/read/all'),
    deleteAll: () => api.delete('/notifications/all'),
  },
};

// Error handling utility
export const handleApiError = (error: AxiosError | Error | unknown): string => {
  if (
    error &&
    typeof error === 'object' &&
    'response' in error &&
    (error.response as AxiosResponse)?.data?.message
  ) {
    return (error.response as AxiosResponse).data.message;
  }
  if (
    error &&
    typeof error === 'object' &&
    'message' in error &&
    typeof error.message === 'string'
  ) {
    return error.message;
  }
  return 'An unexpected error occurred';
};

export default api;
