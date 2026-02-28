import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/services/api', () => ({
  default: { get: vi.fn(), delete: vi.fn() },
}));

import api from '@/services/api';
import { EventService } from '@/services/EventService';

const mockedApi = vi.mocked(api, true);

describe('EventService edge regressions', () => {
  beforeEach(() => vi.clearAllMocks());

  it('must request upcoming events with strict status + default limit', async () => {
    mockedApi.get.mockResolvedValueOnce({ data: [] } as never);

    await EventService.getUpcoming();

    expect(mockedApi.get).toHaveBeenCalledWith('/events', {
      params: { status: 'UPCOMING', limit: 3 },
    });
  });

  it('must include force=false by default on remove', async () => {
    mockedApi.delete.mockResolvedValueOnce({ data: {} } as never);

    await EventService.remove('e-1');

    expect(mockedApi.delete).toHaveBeenCalledWith('/events/e-1', {
      params: { force: false },
    });
  });
});
