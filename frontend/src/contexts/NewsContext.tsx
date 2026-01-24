import React, { createContext, useContext, useState, useCallback } from 'react';
import newsService, { NewsItem } from '@/services/newsService';

type NewsContextValue = {
  news: NewsItem[];
  loading: boolean;
  loadNews: (page?: number, limit?: number) => Promise<void>;
  getBySlug: (slug: string) => Promise<NewsItem | null>;
  clear: () => void;
  create: (data: Partial<NewsItem>) => Promise<NewsItem>;
  update: (id: string, data: Partial<NewsItem>) => Promise<NewsItem>;
  remove: (id: string) => Promise<void>;
  saving: boolean;
};

const NewsContext = createContext<NewsContextValue | undefined>(undefined);

export function NewsProvider({ children }: { children: React.ReactNode }) {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadNews = useCallback(async (page = 1, limit = 20) => {
    setLoading(true);
    try {
      const res = await newsService.list({ page, limit });
      setNews(res.data || []);
    } catch (err) {
      console.error('Failed to load news', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const getBySlug = useCallback(async (slug: string) => {
    try {
      const res = await newsService.getBySlug(slug);
      return res.data || null;
    } catch (err) {
      console.error('Failed to load news by slug', err);
      return null;
    }
  }, []);

  const clear = useCallback(() => setNews([]), []);

  const create = useCallback(async (data: Partial<NewsItem>) => {
    setSaving(true);
    try {
      const res = await newsService.create(data);
      const created: NewsItem = res.data;
      setNews((prev) => [created, ...prev]);
      return created;
    } catch (err) {
      console.error('Failed to create news', err);
      throw err;
    } finally {
      setSaving(false);
    }
  }, []);

  const update = useCallback(async (id: string, data: Partial<NewsItem>) => {
    setSaving(true);
    try {
      const res = await newsService.update(id, data);
      const updated: NewsItem = res.data;
      setNews((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
      return updated;
    } catch (err) {
      console.error('Failed to update news', err);
      throw err;
    } finally {
      setSaving(false);
    }
  }, []);

  const remove = useCallback(async (id: string) => {
    setSaving(true);
    try {
      await newsService.remove(id);
      setNews((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      console.error('Failed to remove news', err);
      throw err;
    } finally {
      setSaving(false);
    }
  }, []);

  return (
    <NewsContext.Provider
      value={{
        news,
        loading,
        loadNews,
        getBySlug,
        clear,
        create,
        update,
        remove,
        saving,
      }}
    >
      {children}
    </NewsContext.Provider>
  );
}

export const useNews = () => {
  const ctx = useContext(NewsContext);
  if (!ctx) throw new Error('useNews must be used within NewsProvider');
  return ctx;
};
export default NewsContext;
