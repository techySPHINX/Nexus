import axios from 'axios';
import { Notification } from '@/types/notification';

const api = axios.create({ baseURL: 'http://localhost:3000' });
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export async function fetchNotificationsService(
  page = 1,
  limit = 10,
  typeOrCategory?: string
) {
  try {
    const params: Record<string, unknown> = { page, limit };
    if (typeOrCategory && typeOrCategory !== 'ALL') {
      params.type = typeOrCategory;
    }
    const [notificationRes, unreadCountRes] = await Promise.all([
      api.get('/notifications', { params }),
      api.get('/notifications/count/unread'),
    ]);
    return {
      notification: notificationRes.data.notifications,
      pagination: notificationRes.data.pagination,
      unreadCount: unreadCountRes.data.unreadCount,
    };
  } catch (err) {
    if (axios.isAxiosError(err)) {
      throw new Error(
        err.response?.data?.message || 'Failed to fetch notifications'
      );
    }
    throw new Error('Failed to fetch notifications');
  }
}

export async function addNotificationService(
  notification: Omit<Notification, 'id' | 'timestamp' | 'read'>
) {
  try {
    const response = await api.post('/notifications', notification);
    return response.data;
  } catch (err) {
    if (axios.isAxiosError(err)) {
      throw new Error(
        err.response?.data?.message || 'Failed to add notification'
      );
    }
    throw new Error('Failed to add notification');
  }
}

export async function readNotificationService(id: string) {
  try {
    // const response =
    await api.patch(`/notifications/${id}/read`);
    // return response.data;
  } catch (err) {
    if (axios.isAxiosError(err)) {
      throw new Error(
        err.response?.data?.message || 'Failed to mark notification as read'
      );
    }
    throw new Error('Failed to mark notification as read');
  }
}

export async function unreadNotificationService(id: string) {
  try {
    await api.patch(`/notifications/${id}/unread`);
  } catch (err) {
    if (axios.isAxiosError(err)) {
      throw new Error(
        err.response?.data?.message || 'Failed to mark notification as unread'
      );
    }
    throw new Error('Failed to mark notification as unread');
  }
}

export const fetchNotificationStatsService = async (): Promise<{
  total: number;
  unread: number;
  read: number;
  recent24h: number;
  byCategory: {
    ALL: number;
    CONNECTION: number;
    POST: number;
    MESSAGE: number;
    SYSTEM: number;
    EVENT: number;
    REFERRAL: number;
  };
}> => {
  const response = await api.get('/notifications/stats');
  return response.data;
};

export async function allReadNotificationService() {
  try {
    await api.patch('/notifications/read/all');
  } catch (err) {
    if (axios.isAxiosError(err)) {
      throw new Error(
        err.response?.data?.message ||
          'Failed to mark all notifications as read'
      );
    }
    throw new Error('Failed to mark all notifications as read');
  }
}

export async function deleteNotificationService(id: string): Promise<void> {
  try {
    const response = await api.delete(`/notifications/${id}`);
    if (response.status !== 200) {
      throw new Error('Failed to delete notification');
    }
    return response.data;
  } catch (err) {
    if (axios.isAxiosError(err)) {
      throw new Error(
        err.response?.data?.message || 'Failed to delete notification'
      );
    }
    throw new Error('Failed to delete notification');
  }
}

export async function deleteReadNotificationService(): Promise<void> {
  try {
    const response = await api.delete(`/notifications/read/all`);
    if (response.status !== 200) {
      throw new Error('Failed to delete all read notifications');
    }
    return response.data;
  } catch (err) {
    if (axios.isAxiosError(err)) {
      throw new Error(
        err.response?.data?.message || 'Failed to delete all read notifications'
      );
    }
    throw new Error('Failed to delete all read notifications');
  }
}

export async function deleteAllNotificationService(): Promise<void> {
  try {
    const response = await api.delete(`/notifications/all`);
    if (response.status !== 200) {
      throw new Error('Failed to delete all notifications');
    }
    return response.data;
  } catch (err) {
    if (axios.isAxiosError(err)) {
      throw new Error(
        err.response?.data?.message || 'Failed to delete all notifications'
      );
    }
    throw new Error('Failed to delete all notification');
  }
}
