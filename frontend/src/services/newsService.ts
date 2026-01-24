import api from './api';

export type NewsItem = {
  id: string;
  title: string;
  slug: string;
  summary?: string;
  topic?: string | null;
  content: string;
  imageUrl?: string | null;
  published?: boolean;
  publishedAt?: string | null;
  authorId?: string | null;
};

export const newsService = {
  list: (opts?: { page?: number; limit?: number }) => {
    const page = opts?.page || 1;
    const limit = opts?.limit || 20;
    return api.get('/news', {
      params: { skip: (page - 1) * limit, take: limit },
    });
  },

  getBySlug: (slug: string) => api.get(`/news/${encodeURIComponent(slug)}`),

  create: (data: Partial<NewsItem>) => api.post('/news', data),

  update: (id: string, data: Partial<NewsItem>) => api.put(`/news/${id}`, data),

  remove: (id: string) => api.delete(`/news/${id}`),
};

export default newsService;
