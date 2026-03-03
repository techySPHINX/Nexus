import { ReactNode } from 'react';
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/services/newsService', () => ({
  default: {
    list: vi.fn(),
    getBySlug: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  },
}));

import { NewsProvider, useNews } from '@/contexts/NewsContext';
import newsService from '@/services/newsService';

const mockedNewsService = vi.mocked(newsService, true);

const wrapper = ({ children }: { children: ReactNode }) => (
  <NewsProvider>{children}</NewsProvider>
);

describe('unit news: NewsContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads news into context state', async () => {
    mockedNewsService.list.mockResolvedValueOnce({
      data: [{ id: 'n1', title: 'First', slug: 'first', content: 'x' }],
    } as never);

    const { result } = renderHook(() => useNews(), { wrapper });

    await act(async () => {
      await result.current.loadNews(1, 10);
    });

    expect(result.current.news).toHaveLength(1);
    expect(result.current.news[0].id).toBe('n1');
  });

  it('prepends create, applies update, and removes deleted item', async () => {
    mockedNewsService.list.mockResolvedValueOnce({
      data: [{ id: 'n1', title: 'First', slug: 'first', content: 'x' }],
    } as never);
    mockedNewsService.create.mockResolvedValueOnce({
      data: { id: 'n2', title: 'Second', slug: 'second', content: 'y' },
    } as never);
    mockedNewsService.update.mockResolvedValueOnce({
      data: { id: 'n2', title: 'Second Updated', slug: 'second', content: 'y' },
    } as never);
    mockedNewsService.remove.mockResolvedValueOnce({} as never);

    const { result } = renderHook(() => useNews(), { wrapper });

    await act(async () => {
      await result.current.loadNews();
      await result.current.create({ title: 'Second', content: 'y' });
      await result.current.update('n2', { title: 'Second Updated' });
      await result.current.remove('n2');
    });

    expect(result.current.news).toHaveLength(1);
    expect(result.current.news[0].id).toBe('n1');
    expect(result.current.saving).toBe(false);
  });
});
