import React, { createContext, useCallback, useState } from 'react';
export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const addNotification = useCallback((notification) => {
        const id = notification.notification_id || Date.now();
        setNotifications(prev => [
            {
                ...notification,
                id: notification.notification_id || id
            },
            ...prev
        ]);
        if (!notification.is_read) {
            setUnreadCount(prev => prev + 1);
        }
    }, []);

    const markAsRead = useCallback((notificationId) => {
        setNotifications(prev =>
            prev.map(notif =>
                notif.id === notificationId || notif.notification_id === notificationId
                    ? { ...notif, is_read: true }
                    : notif
            )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
    }, []);

    const removeNotification = useCallback((notificationId) => {
        setNotifications(prev =>
            prev.filter(notif => notif.id !== notificationId && notif.notification_id !== notificationId)
        );
    }, []);

    const setNotificationsFromAPI = useCallback((data) => {
        setNotifications(data);
    }, []);

    const setUnreadCountFromAPI = useCallback((count) => {
        setUnreadCount(count);
    }, []);

    const value = {
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        removeNotification,
        setNotificationsFromAPI,
        setUnreadCountFromAPI
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
};
