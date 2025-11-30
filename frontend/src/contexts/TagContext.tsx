import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from 'react';
import { ShowcaseService } from '@/services/ShowcaseService';
import type { Tags } from '@/types/ShowcaseType';

type TagContextType = {
  tags: Tags[];
  loading: boolean;
  fetchTags: () => Promise<void>;
};

const TagContext = createContext<TagContextType | undefined>(undefined);

export const useTagContext = (): TagContextType => {
  const ctx = useContext(TagContext);
  if (!ctx) throw new Error('useTagContext must be used within TagProvider');
  return ctx;
};

const TagProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tags, setTags] = useState<Tags[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTags = useCallback(async () => {
    setLoading(true);
    try {
      const res = await ShowcaseService.getAllProjectTypes();
      // Expecting array of { id, name }
      setTags(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error('Failed to fetch tags', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchTags();
  }, [fetchTags]);

  return (
    <TagContext.Provider value={{ tags, loading, fetchTags }}>
      {children}
    </TagContext.Provider>
  );
};

export default TagProvider;
