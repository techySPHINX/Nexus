import { FC, createContext, useContext, useState, useCallback } from 'react';
import { EventService } from '@/services/EventService';
import type { Event } from '@/types/Event';
import { useNotification } from './NotificationContext';
import { getErrorMessage } from '@/utils/errorHandler';

type EventContextShape = {
  upcoming: Event[];
  events: Event[];
  current?: Event | null;
  loading: boolean;
  error: string | null;

  fetchUpcoming: (limit?: number) => Promise<void>;
  fetchEvents: (opts?: Record<string, unknown>) => Promise<void>;
  fetchById: (id: string) => Promise<Event | null>;
  createEvent: (payload: Partial<Event>) => Promise<Event>;
  clear: () => void;
};

const EventContext = createContext<EventContextShape | undefined>(undefined);

export const useEventContext = (): EventContextShape => {
  const ctx = useContext(EventContext);
  if (!ctx) {
    throw new Error('useEventContext must be used within EventProvider');
  }
  return ctx;
};

export const EventProvider: FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { showNotification } = useNotification();
  const [upcoming, setUpcoming] = useState<Event[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [current, setCurrent] = useState<Event | null | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUpcoming = useCallback(
    async (limit = 3) => {
      setLoading(true);
      setError(null);
      try {
        console.log('Fetching upcoming events with limit:', limit);
        const data = await EventService.getUpcoming(limit);
        console.log('Fetched upcoming events:', data);
        // API may return an array or an object like { items: [], data: [], results: [], total }
        const list: Event[] = Array.isArray(data)
          ? data
          : data?.items || data?.data || data?.results || [];
        console.log('Parsed upcoming events list:', list);
        setUpcoming(list);
        console.log('Upcoming events state updated:', list);
        showNotification?.('Upcoming events fetched', 'success');
      } catch (err) {
        showNotification?.(getErrorMessage(err), 'error');
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    },
    [showNotification]
  );

  const fetchEvents = useCallback(
    async (opts?: Record<string, unknown>) => {
      setLoading(true);
      setError(null);
      try {
        const data = await EventService.getAll(opts);
        // Normalize different response shapes from the server
        const list: Event[] = Array.isArray(data)
          ? data
          : data?.items || data?.data || data?.results || [];
        setEvents(list);
        showNotification?.('Events fetched', 'success');
      } catch (err) {
        showNotification?.(getErrorMessage(err), 'error');
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    },
    [showNotification]
  );

  const fetchById = useCallback(
    async (id: string) => {
      setLoading(true);
      setError(null);
      try {
        const data = await EventService.getById(id);
        const ev: Event = data?.data || data || null;
        setCurrent(ev);
        showNotification?.('Event fetched', 'success');
        return ev;
      } catch (err) {
        showNotification?.(getErrorMessage(err), 'error');
        setError(getErrorMessage(err));
        return null;
      } finally {
        setLoading(false);
      }
    },
    [showNotification]
  );

  const createEvent = useCallback(
    async (payload: Partial<Event>) => {
      setLoading(true);
      setError(null);
      try {
        console.log('Creating event with payload:', payload);
        const created = await EventService.create(payload);
        const ev: Event = created?.data || created;
        // prepend to events/upcoming if relevant
        setEvents((prev) => [ev, ...prev]);
        setUpcoming((prev) => [ev, ...prev].slice(0, 10));
        showNotification?.('Event created', 'success');
        return ev as Event;
      } catch (err) {
        showNotification?.(getErrorMessage(err), 'error');
        setError(getErrorMessage(err));
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [showNotification]
  );

  const clear = useCallback(() => {
    setUpcoming([]);
    setEvents([]);
    setCurrent(undefined);
    setError(null);
  }, []);

  return (
    <EventContext.Provider
      value={{
        upcoming,
        events,
        current,
        loading,
        error,
        fetchUpcoming,
        fetchEvents,
        fetchById,
        createEvent,
        clear,
      }}
    >
      {children}
    </EventContext.Provider>
  );
};
