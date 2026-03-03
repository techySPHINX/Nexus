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
import { EventService } from '@/services/EventService';

const mockedApi = vi.mocked(api, true);

describe('api integration events: EventService -> api', () => {
  beforeEach(() => vi.clearAllMocks());

  it('maps getUpcoming/getAll/getById/create/update/remove endpoints', async () => {
    mockedApi.get.mockResolvedValue({ data: {} } as never);
    mockedApi.post.mockResolvedValue({ data: {} } as never);
    mockedApi.put.mockResolvedValue({ data: {} } as never);
    mockedApi.delete.mockResolvedValue({ data: {} } as never);

    await EventService.getUpcoming(5);
    await EventService.getAll({ status: 'UPCOMING', page: 2 });
    await EventService.getById('e1');
    await EventService.create({ title: 'Launch' } as never);
    await EventService.update('e1', { title: 'Launch 2' } as never);
    await EventService.remove('e1', true);

    expect(mockedApi.get).toHaveBeenNthCalledWith(1, '/events', {
      params: { status: 'UPCOMING', limit: 5 },
    });
    expect(mockedApi.get).toHaveBeenNthCalledWith(2, '/events', {
      params: { status: 'UPCOMING', page: 2 },
    });
    expect(mockedApi.get).toHaveBeenNthCalledWith(3, '/events/e1');
    expect(mockedApi.post).toHaveBeenCalledWith('/events', { title: 'Launch' });
    expect(mockedApi.put).toHaveBeenCalledWith('/events/e1', {
      title: 'Launch 2',
    });
    expect(mockedApi.delete).toHaveBeenCalledWith('/events/e1', {
      params: { force: true },
    });
  });
});
