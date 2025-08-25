import {
  fetchNotificationsService,
  addNotificationService,
  readNotificationService,
  unreadNotificationService,
  allReadNotificationService,
  deleteNotificationService,
  deleteReadNotificationService,
  fetchNotificationStatsService,
} from '@/services/notificationService';
import { Notification, NotificationType } from '@/types/notification';
import React, { createContext, useContext, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';

interface NotificationContextType {
  notifications: Notification[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  unreadCount: number;
  unreadCountsByCategory: Record<string, number>;
  loading: boolean;
  error: string | null;
  fetchNotifications: (
    page?: number,
    limit?: number,
    category?: string
  ) => Promise<void>;
  setPage: (page: number, category?: string) => void;
  addNotification: (
    notification: Omit<Notification, 'id' | 'timestamp' | 'read'>
  ) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAsUnread: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  deleteReadNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);


export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [pagination, setPagination] = useState<{
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  }>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  });
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadCountsByCategory, setUnreadCountsByCategory] = useState<
    Record<string, number>
  >({
    ALL: 0,
    CONNECTION: 0,
    POST: 0,
    MESSAGE: 0,
    SYSTEM: 0,
    EVENT: 0,
    REFERRAL: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update the fetchAllUnreadCounts function
  const fetchAllUnreadCounts = useCallback(async () => {
    if (!user) return;

    try {
      // Use the stats endpoint to get accurate unread counts by category
      const stats = await fetchNotificationStatsService();

      const counts: Record<string, number> = {
        ALL: stats.byCategory.ALL,
        CONNECTION: stats.byCategory.CONNECTION,
        POST: stats.byCategory.POST,
        MESSAGE: stats.byCategory.MESSAGE,
        SYSTEM: stats.byCategory.SYSTEM,
        EVENT: stats.byCategory.EVENT,
        REFERRAL: stats.byCategory.REFERRAL,
      };

      setUnreadCountsByCategory(counts);
      setUnreadCount(stats.unread);
    } catch (err) {
      console.error('Failed to fetch notification stats:', err);

      // Fallback to individual API calls if stats endpoint fails
      try {
        const allResponse = await fetchNotificationsService(1, 1);
        const counts: Record<string, number> = {
          ALL: allResponse.unreadCount,
          CONNECTION: 0,
          POST: 0,
          MESSAGE: 0,
          SYSTEM: 0,
          EVENT: 0,
          REFERRAL: 0,
        };

        // Fetch counts for each category individually as fallback
        const categoryPromises = Object.entries(categoryToTypes).map(
          async ([category, types]) => {
            const results = await Promise.all(
              types.map((type) => fetchNotificationsService(1, 1, type))
            );
            counts[category] = results.reduce(
              (sum, result) => sum + result.unreadCount,
              0
            );
          }
        );

        await Promise.all(categoryPromises);
        setUnreadCountsByCategory(counts);
        setUnreadCount(counts.ALL);
      } catch (fallbackErr) {
        console.error('Fallback also failed:', fallbackErr);
      }
    }
  }, [user]);

  const fetchNotifications = useCallback(
    async (page = 1, limit = 10, category?: string) => {
      if (!user) return;
      setLoading(true);
      setError(null);
      try {
        // If category is provided and it's not 'ALL', get the specific types
        let types: NotificationType[] = [];

        if (category && category !== 'ALL' && categoryToTypes[category]) {
          types = categoryToTypes[category];
        }

        // If we have specific types for this category, fetch them individually and merge
        if (types.length > 0) {
          const results = await Promise.all(
            types.map((type) => fetchNotificationsService(page, limit, type))
          );

          // Merge notifications from all types
          const allNotifications = results.flatMap((r) => r.notification);

          // Sort by createdAt desc
          allNotifications.sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );

          // Calculate proper pagination for merged results
          const totalItems = results.reduce(
            (sum, r) => sum + r.pagination.total,
            0
          );
          const totalPages = Math.ceil(totalItems / limit);

          const mergedPagination = {
            page,
            limit,
            total: totalItems,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1,
          };

          setNotifications(allNotifications);
          setPagination(mergedPagination);
        } else {
          // Fetch all notifications (category is ALL or unknown)
          const response = await fetchNotificationsService(page, limit);
          setNotifications(response.notification);
          setPagination(response.pagination);
        }

        // Refresh all unread counts after fetching notifications
        await fetchAllUnreadCounts();
      } catch (err) {
        setError('Failed to fetch notifications');
        console.error('Notification fetch error:', err);
      } finally {
        setLoading(false);
      }
    },
    [user, fetchAllUnreadCounts]
  );

  const setPage = (newPage: number, category?: string) => {
    if (pagination && newPage > 0 && newPage <= pagination.totalPages) {
      fetchNotifications(newPage, pagination.limit, category);
    }
  };

  const addNotification = async (
    notification: Omit<Notification, 'id' | 'timestamp' | 'read'>
  ) => {
    try {
      const response = await addNotificationService(notification);
      setNotifications((prev) => [response.data, ...prev]);

      // Update unread counts
      setUnreadCount((prev) => prev + 1);
      const category =
        Object.entries(categoryToTypes).find(([, types]) =>
          types.includes(notification.type as NotificationType)
        )?.[0] || 'ALL';

      setUnreadCountsByCategory((prev) => ({
        ...prev,
        [category]: (prev[category] || 0) + 1,
        ALL: prev.ALL + 1,
      }));
    } catch (err) {
      console.error('Failed to add notification:', err);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const notification = notifications.find((n) => n.id === id);
      if (!notification) return;

      await readNotificationService(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );

      // Update unread counts
      if (!notification.read) {
        setUnreadCount((prev) => (prev > 0 ? prev - 1 : 0));

        const category =
          Object.entries(categoryToTypes).find(([, types]) =>
            types.includes(notification.type as NotificationType)
          )?.[0] || 'ALL';

        setUnreadCountsByCategory((prev) => ({
          ...prev,
          [category]: Math.max(0, (prev[category] || 0) - 1),
          ALL: Math.max(0, prev.ALL - 1),
        }));
      }
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const markAsUnread = async (id: string) => {
    try {
      const notification = notifications.find((n) => n.id === id);
      if (!notification) return;

      await unreadNotificationService(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: false } : n))
      );

      // Update unread counts
      if (notification.read) {
        setUnreadCount((prev) => prev + 1);

        const category =
          Object.entries(categoryToTypes).find(([, types]) =>
            types.includes(notification.type as NotificationType)
          )?.[0] || 'ALL';

        setUnreadCountsByCategory((prev) => ({
          ...prev,
          [category]: (prev[category] || 0) + 1,
          ALL: prev.ALL + 1,
        }));
      }
    } catch (err) {
      console.error('Failed to mark notification as unread:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await allReadNotificationService();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

      // Reset all unread counts
      setUnreadCount(0);
      setUnreadCountsByCategory({
        ALL: 0,
        CONNECTION: 0,
        POST: 0,
        MESSAGE: 0,
        SYSTEM: 0,
        EVENT: 0,
        REFERRAL: 0,
      });
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    }
  };

  const deleteNotification = async (id: string): Promise<void> => {
    try {
      const notificationToDelete = notifications.find((n) => n.id === id);
      await deleteNotificationService(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));

      // Adjust unreadCount if the deleted notification was unread
      if (notificationToDelete && !notificationToDelete.read) {
        setUnreadCount((prev) => (prev > 0 ? prev - 1 : 0));

        const category =
          Object.entries(categoryToTypes).find(([, types]) =>
            types.includes(notificationToDelete.type as NotificationType)
          )?.[0] || 'ALL';

        setUnreadCountsByCategory((prev) => ({
          ...prev,
          [category]: Math.max(0, (prev[category] || 0) - 1),
          ALL: Math.max(0, prev.ALL - 1),
        }));
      }
    } catch (err) {
      console.error('API Delete Error:', err);
      throw err;
    }
  };

  const deleteReadNotifications = async (): Promise<void> => {
    try {
      await deleteReadNotificationService();
      await fetchAllUnreadCounts(); // Refresh counts after deletion
      await fetchNotifications(pagination.page, pagination.limit, 'ALL');
    } catch (err) {
      console.error('API Delete Error:', err);
      throw err;
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        pagination,
        unreadCount,
        unreadCountsByCategory,
        loading,
        error,
        fetchNotifications,
        setPage,
        addNotification,
        markAsRead,
        markAsUnread,
        markAllAsRead,
        deleteNotification,
        deleteReadNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      'useNotification must be used within a NotificationProvider'
    );
  }
  return context;
};
