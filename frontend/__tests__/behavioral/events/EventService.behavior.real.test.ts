import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

import api from '@/services/api';
import { EventService } from '@/services/EventService';

const mockedApi = vi.mocked(api, true);

describe('behavior events: EventService', () => {
  beforeEach(() => vi.clearAllMocks());

  it('requests upcoming events with explicit limit', async () => {
    mockedApi.get.mockResolvedValueOnce({ data: [] } as never);

    await EventService.getUpcoming(8);

    expect(mockedApi.get).toHaveBeenCalledWith('/events', {
      params: { status: 'UPCOMING', limit: 8 },
    });
  });

  it('passes opts through getAll as query params', async () => {
    mockedApi.get.mockResolvedValueOnce({ data: [] } as never);

    await EventService.getAll({ status: 'PAST', page: 2 });

    expect(mockedApi.get).toHaveBeenCalledWith('/events', {
      params: { status: 'PAST', page: 2 },
    });
  });
});
