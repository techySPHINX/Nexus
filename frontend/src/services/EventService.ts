import api from './api';
import type { Event } from '@/types/Event';
import { getErrorMessage } from '@/utils/errorHandler';

export const EventService = {
  getUpcoming: async (limit = 3) => {
    try {
      const response = await api.get('/events', {
        params: { status: 'UPCOMING', limit },
      });
      return response.data;
    } catch (error) {
      throw new Error(
        'Failed to fetch upcoming events: ' + getErrorMessage(error)
      );
    }
  },

  getAll: async (opts?: Record<string, unknown>) => {
    try {
      const response = await api.get('/events', { params: opts });
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch events: ' + getErrorMessage(error));
    }
  },

  getById: async (id: string) => {
    try {
      const response = await api.get(`/events/${id}`);
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch event: ' + getErrorMessage(error));
    }
  },

  create: async (payload: Partial<Event>) => {
    try {
      const response = await api.post('/events', payload);
      return response.data;
    } catch (error) {
      throw new Error('Failed to create event: ' + getErrorMessage(error));
    }
  },
  update: async (id: string, payload: Partial<Event>) => {
    try {
      const response = await api.put(`/events/${id}`, payload);
      return response.data;
    } catch (error) {
      throw new Error('Failed to update event: ' + getErrorMessage(error));
    }
  },

  remove: async (id: string, force = false) => {
    try {
      const response = await api.delete(`/events/${id}`, {
        params: { force },
      });
      return response.data;
    } catch (error) {
      throw new Error('Failed to delete event: ' + getErrorMessage(error));
    }
  },
};
