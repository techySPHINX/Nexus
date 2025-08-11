import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';

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
    update: (id: string, data: any) => api.patch(`/users/${id}`, data),
    delete: (id: string) => api.delete(`/users/${id}`),
  },

  // Profile endpoints
  profile: {
    get: (userId: string) => api.get(`/profile/${userId}`),
    update: (userId: string, data: any) => api.put(`/profile/${userId}`, data),
  },

  // Connection endpoints
  connections: {
    getAll: ({ page, limit, role, search }: { page: number; limit: number; role?: 'STUDENT' | 'ALUM' | 'ADMIN'; search?: string }) =>
      api.get('/connection', { params: { page, limit, role, search } }),
    getStats: () => api.get('/connection/stats'),
    getPendingReceived: ({ page, limit }: { page: number; limit: number }) =>
      api.get('/connection/pending/received', { params: { page, limit } }),
    getPendingSent: ({ page, limit }: { page: number; limit: number }) =>
      api.get('/connection/pending/sent', { params: { page, limit } }),
    getStatus: (userId: string) => api.get(`/connection/status/${userId}`),
    getSuggestions: ({ limit }: { limit: number }) =>
      api.get('/connection/suggestions', { params: { limit } }),
    send: (recipientId: string) => api.post('/connection/send', { recipientId }),
    updateStatus: (connectionId: string, status: string) =>
      api.patch('/connection/status', { connectionId, status }),
    cancel: (connectionId: string) => api.delete(`/connection/cancel/${connectionId}`),
    remove: (connectionId: string) => api.delete(`/connection/remove/${connectionId}`),
  },

  // Message endpoints
  messages: {
    send: (content: string, receiverId: string) =>
      api.post('/messages', { content, receiverId }),
    getConversation: (otherUserId: string) =>
      api.get(`/messages/conversation/${otherUserId}`),
    getAllConversations: () => api.get('/messages/conversations/all'),
  },

  // Post endpoints
  posts: {
    create: (userId: string, data: any) => api.post(`/posts/${userId}`, data),
    getAll: () => api.get('/posts'),
    getByUser: (userId: string) => api.get(`/posts/user/${userId}`),
    update: (id: string, userId: string, data: any) =>
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
    create: (data: any) => api.post('/notifications', data),
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
export const handleApiError = (error: any): string => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.message) {
    return error.message;
  }
  return 'An unexpected error occurred';
};

export default api;
