import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import { clearAllShowcaseCache } from '@/contexts/showcasePersistence';

// Create axios instance with default config
const api: AxiosInstance = axios.create({
  baseURL: 'http://localhost:3000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // clear cached persisted data associated with the session
      clearAllShowcaseCache().catch(() => {});
      window.location.href = '/login';
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
    }) => api.get('/connection', { params: { page, limit, role, search } }),
    getStats: () => api.get('/connection/stats'),
    getPendingReceived: ({ page, limit }: { page: number; limit: number }) =>
      api.get('/connection/pending/received', { params: { page, limit } }),
    getPendingSent: ({ page, limit }: { page: number; limit: number }) =>
      api.get('/connection/pending/sent', { params: { page, limit } }),
    getStatus: (userId: string) => api.get(`/connection/status/${userId}`),
    getSuggestions: ({ limit }: { limit: number }) =>
      api.get('/connection/suggestions', { params: { limit } }),
    send: (recipientId: string) =>
      api.post('/connection/send', { recipientId }),
    updateStatus: (connectionId: string, status: string) =>
      api.patch('/connection/status', { connectionId, status }),
    cancel: (connectionId: string) =>
      api.delete(`/connection/cancel/${connectionId}`),
    remove: (connectionId: string) =>
      api.delete(`/connection/remove/${connectionId}`),
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
    getAll: () => api.get('/referral'),
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
    getAll: () => api.get('/posts'),
    getByUser: (userId: string) => api.get(`/posts/user/${userId}`),
    update: (id: string, userId: string, data: unknown) =>
      api.patch(`/posts/${id}/user/${userId}`, data),
    delete: (id: string, userId: string) =>
      api.delete(`/posts/${id}/user/${userId}`),
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
