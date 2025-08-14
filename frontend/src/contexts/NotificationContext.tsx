import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

enum NotificationType {
    CONNECTION_REQUEST = 'CONNECTION_REQUEST',
    CONNECTION_ACCEPTED = 'CONNECTION_ACCEPTED',
    POST_LIKE = 'POST_LIKE',
    POST_COMMENT = 'POST_COMMENT',
    MESSAGE = 'MESSAGE',
    SYSTEM = 'SYSTEM',
    EVENT = 'EVENT',
}

interface Notification {
    id: string;
    type: NotificationType;
    message: string;
    timestamp: Date;
    read: boolean;
}

interface User {
    id: string;
    name: string;
    email: string;
    token?: string;
}

interface NotificationContextType {
    user: User | null;
    notifications: Notification[];
    unreadCount: number;
    loading: boolean;
    error: string | null;
    fetchNotifications: () => Promise<void>;
    addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => Promise<void>;
    markAsRead: (id: string) => Promise<void>;
    markAsUnread: (id: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    deleteNotification: (id: string) => Promise<void>;
    login: (userData: User) => void;
    logout: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const api = axios.create({
        baseURL: 'http://localhost:3000',
    });

    api.interceptors.request.use(config => {
        if (user?.token) {
            config.headers.Authorization = `Bearer ${user.token}`;
        }
        return config;
    });

    const fetchNotifications = async () => {
        if (!user) return;

        setLoading(true);
        setError(null);
        try {
            const [notificationsRes, unreadRes] = await Promise.all([
                api.get('/notifications'),
                api.get('/notifications/count/unread'),
            ]);

            setNotifications(notificationsRes.data.notifications);
            setUnreadCount(unreadRes.data.unreadCount);
        } catch (err) {
            setError('Failed to fetch notifications');
            console.error('Notification fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    const addNotification = async (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
        try {
            const response = await api.post('/notifications', notification);
            setNotifications(prev => [response.data, ...prev]);
            setUnreadCount(prev => prev + 1);
        } catch (err) {
            console.error('Failed to add notification:', err);
        }
    };

    const markAsRead = async (id: string) => {
        try {
            await api.patch(`/notifications/${id}/read`);
            setNotifications(prev =>
                prev.map(n => n.id === id ? { ...n, read: true } : n)
            );
            setUnreadCount(prev => (prev > 0 ? prev - 1 : 0));
        } catch (err) {
            console.error('Failed to mark notification as read:', err);
        }
    };

    const markAsUnread = async (id: string) => {
        try {
            await api.patch(`/notifications/${id}/unread`);
            setNotifications(prev =>
                prev.map(n => n.id === id ? { ...n, read: false } : n)
            );
            setUnreadCount(prev => prev + 1); // This ensures the count updates
        } catch (err) {
            console.error('Failed to mark notification as unread:', err);
        }
    };

    const markAllAsRead = async () => {
        try {
            await api.patch('/notifications/read/all');
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            setUnreadCount(0);
        } catch (err) {
            console.error('Failed to mark all notifications as read:', err);
        }
    };

    const deleteNotification = async (id: string): Promise<void> => {
        try {
            const response = await api.delete(`/notifications/${id}`);

            // Optional: Add response validation if your API returns specific data
            if (response.status !== 200) {
                throw new Error('Failed to delete notification');
            }

            return response.data; // If your API returns any data
        } catch (err) {
            console.error('API Delete Error:', err);
            throw err; // Re-throw to let the UI handler manage the error
        }
    };

    const login = (userData: User) => {
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
    };

    const logout = () => {
        setUser(null);
        setNotifications([]);
        setUnreadCount(0);
        localStorage.removeItem('user');
    };

    // Load user from storage on initial render
    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }, []);

    return (
        <NotificationContext.Provider
            value={{
                user,
                notifications,
                unreadCount,
                loading,
                error,
                fetchNotifications,
                addNotification,
                markAsRead,
                markAsUnread,
                markAllAsRead,
                deleteNotification,
                login,
                logout,
            }}
        >
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
};