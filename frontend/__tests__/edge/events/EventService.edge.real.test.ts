import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/services/api', () => ({
  default: {
    get: vi.fn(),
    delete: vi.fn(),
  },
}));

import api from '@/services/api';
import { EventService } from '@/services/EventService';

const mockedApi = vi.mocked(api, true);

describe('edge events: EventService', () => {
  beforeEach(() => vi.clearAllMocks());

  it('clamps non-positive upcoming limit to default 3', async () => {
    mockedApi.get.mockResolvedValueOnce({ data: [] } as never);

    await EventService.getUpcoming(0);

    expect(mockedApi.get).toHaveBeenCalledWith('/events', {
      params: { status: 'UPCOMING', limit: 3 },
    });
  });

  it('uses force=false by default for remove', async () => {
    mockedApi.delete.mockResolvedValueOnce({ data: {} } as never);

    await EventService.remove('e-1');

    expect(mockedApi.delete).toHaveBeenCalledWith('/events/e-1', {
      params: { force: false },
    });
  });
});
