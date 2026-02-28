import { ReactNode } from 'react';
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const showNotification = vi.fn();

vi.mock('@/services/EventService', () => ({
  EventService: {
    getUpcoming: vi.fn(),
    getAll: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
  },
}));

vi.mock('@/contexts/NotificationContext', () => ({
  useNotification: () => ({ showNotification }),
}));

import { EventProvider, useEventContext } from '@/contexts/eventContext';
import { EventService } from '@/services/EventService';

const mockedEventService = vi.mocked(EventService, true);

const wrapper = ({ children }: { children: ReactNode }) => (
  <EventProvider>{children}</EventProvider>
);

describe('unit events: eventContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('normalizes fetchUpcoming response shape with items[]', async () => {
    mockedEventService.getUpcoming.mockResolvedValueOnce({
      items: [{ id: 'e1', title: 'Launch' }],
    } as never);

    const { result } = renderHook(() => useEventContext(), { wrapper });

    await act(async () => {
      await result.current.fetchUpcoming(5);
    });

    expect(result.current.upcoming).toHaveLength(1);
    expect(result.current.upcoming[0].id).toBe('e1');
  });

  it('prepends created event into events and upcoming', async () => {
    mockedEventService.create.mockResolvedValueOnce({
      data: { id: 'e2', title: 'Hackathon' },
    } as never);

    const { result } = renderHook(() => useEventContext(), { wrapper });

    await act(async () => {
      await result.current.createEvent({ title: 'Hackathon' } as never);
    });

    expect(result.current.events[0].id).toBe('e2');
    expect(result.current.upcoming[0].id).toBe('e2');
  });
});
