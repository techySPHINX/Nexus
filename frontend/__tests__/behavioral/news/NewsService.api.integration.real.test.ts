import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

import api from '@/services/api';
import newsService from '@/services/newsService';

const mockedApi = vi.mocked(api, true);

describe('api integration news: newsService -> api', () => {
  beforeEach(() => vi.clearAllMocks());

  it('maps list/getBySlug/create/update/remove endpoints', async () => {
    mockedApi.get.mockResolvedValue({ data: {} } as never);
    mockedApi.post.mockResolvedValue({ data: {} } as never);
    mockedApi.put.mockResolvedValue({ data: {} } as never);
    mockedApi.delete.mockResolvedValue({ data: {} } as never);

    await newsService.list({ page: 3, limit: 10 });
    await newsService.getBySlug('a/b c');
    await newsService.create({ title: 'T', content: 'C' });
    await newsService.update('n1', { title: 'T2' });
    await newsService.remove('n1');

    expect(mockedApi.get).toHaveBeenNthCalledWith(1, '/news', {
      params: { skip: 20, take: 10 },
    });
    expect(mockedApi.get).toHaveBeenNthCalledWith(2, '/news/a%2Fb%20c');
    expect(mockedApi.post).toHaveBeenCalledWith('/news', {
      title: 'T',
      content: 'C',
    });
    expect(mockedApi.put).toHaveBeenCalledWith('/news/n1', { title: 'T2' });
    expect(mockedApi.delete).toHaveBeenCalledWith('/news/n1');
  });
});
