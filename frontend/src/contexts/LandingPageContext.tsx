import landingPageService from '@/services/LandingPageService';
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';

type NewsItem = {
  id: string;
  title: string;
  slug: string;
  summary?: string;
  topic?: string | null;
  content: string;
  imageUrl?: string | null;
  updatedAt?: string | null;
  authorId?: string | null;
};

type LandingPageContextValue = {
  news: NewsItem[];
  loading: boolean;
  loadNews: () => Promise<void>;
};

const LandingPageContext = createContext<LandingPageContextValue | undefined>(
  undefined
);

export function LandingPageProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(false);

  const loadNews = useCallback(async () => {
    setLoading(true);
    try {
      const res = await landingPageService.getNews();
      setNews(res || []);
    } catch (err) {
      console.error('Failed to load news', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const value = useMemo(
    () => ({ news, loading, loadNews }),
    [news, loading, loadNews]
  );

  return (
    <LandingPageContext.Provider value={value}>
      {children}
    </LandingPageContext.Provider>
  );
}

export function useLandingPage() {
  const context = useContext(LandingPageContext);
  if (!context) {
    throw new Error('useLandingPage must be used within a LandingPageProvider');
  }
  return context;
}
