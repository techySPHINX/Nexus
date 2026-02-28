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

describe('Events domain behavior', () => {
  beforeEach(() => vi.clearAllMocks());

  it('requests upcoming events with default filters', async () => {
    mockedApi.get.mockResolvedValueOnce({ data: [] } as never);

    await EventService.getUpcoming();

    expect(mockedApi.get).toHaveBeenCalledWith('/events', {
      params: { status: 'UPCOMING', limit: 3 },
    });
  });
});
