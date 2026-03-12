import api, { isAxiosError } from './api';
import { Notification } from '@/types/notification';
import { NotificationPreference } from '@/types/profileType';

type NotificationPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
};

type FetchNotificationsResponse = {
  notification: Notification[];
  pagination: NotificationPagination;
  unreadCount: number;
};

type FetchNotificationsApiPayload = {
  notifications: Notification[];
  pagination: NotificationPagination;
};

export type CreateNotificationResponse = {
  notification: Notification | null;
  delivered: {
    inApp: boolean;
    push: boolean;
  };
};

export async function fetchNotificationsService(
  page = 1,
  limit = 10,
  typeOrCategory?: string,
  unreadOnly = false
): Promise<FetchNotificationsResponse> {
  try {
    const params: Record<string, unknown> = { page, limit };
    if (unreadOnly) {
      params.unreadOnly = 'true';
    }
    if (typeOrCategory && typeOrCategory !== 'ALL') {
      params.type = typeOrCategory;
    }
    const [notificationRes, unreadCountRes] = await Promise.all([
      api.get<FetchNotificationsApiPayload>('/notifications', { params }),
      api.get<{ unreadCount: number }>('/notifications/count/unread'),
    ]);
    return {
      notification: notificationRes.data.notifications,
      pagination: notificationRes.data.pagination,
      unreadCount: unreadCountRes.data.unreadCount,
    };
  } catch (err) {
    if (isAxiosError(err)) {
      throw new Error(
        err.response?.data?.message || 'Failed to fetch notifications'
      );
    }
    throw new Error('Failed to fetch notifications');
  }
}

export async function addNotificationService(
  notification: Omit<Notification, 'id' | 'timestamp' | 'read'>
): Promise<CreateNotificationResponse> {
  try {
    const response = await api.post<CreateNotificationResponse>(
      '/notifications',
      notification
    );
    return response.data;
  } catch (err) {
    if (isAxiosError(err)) {
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
    if (isAxiosError(err)) {
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
    if (isAxiosError(err)) {
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
    if (isAxiosError(err)) {
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
    if (response.status < 200 || response.status >= 300) {
      throw new Error('Failed to delete notification');
    }
    return response.data;
  } catch (err) {
    if (isAxiosError(err)) {
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
    if (response.status < 200 || response.status >= 300) {
      throw new Error('Failed to delete all read notifications');
    }
    return response.data;
  } catch (err) {
    if (isAxiosError(err)) {
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
    if (response.status < 200 || response.status >= 300) {
      throw new Error('Failed to delete all notifications');
    }
    return response.data;
  } catch (err) {
    if (isAxiosError(err)) {
      throw new Error(
        err.response?.data?.message || 'Failed to delete all notifications'
      );
    }
    throw new Error('Failed to delete all notification');
  }
}

export async function getNotificationPreferenceService(): Promise<NotificationPreference> {
  try {
    const response = await api.get('/notifications/preferences/me');
    return response.data;
  } catch (err) {
    if (isAxiosError(err)) {
      throw new Error(
        err.response?.data?.message || 'Failed to fetch notification preference'
      );
    }
    throw new Error('Failed to fetch notification preference');
  }
}

export async function updateNotificationPreferenceService(
  payload: Partial<NotificationPreference>
): Promise<NotificationPreference> {
  try {
    const response = await api.patch('/notifications/preferences/me', payload);
    return response.data;
  } catch (err) {
    if (isAxiosError(err)) {
      throw new Error(
        err.response?.data?.message ||
          'Failed to update notification preference'
      );
    }
    throw new Error('Failed to update notification preference');
  }
}
