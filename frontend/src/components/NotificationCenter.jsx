import React, { useEffect, useState } from 'react';
import { useNotifications } from '../hooks/useNotifications';
import { notificationAPI } from '../api/notificationAPI';
import NotificationToast from './NotificationToast';
import NotificationInbox from './NotificationInbox';
import '../styles/NotificationCenter.css';

const NotificationCenter = () => {
    const { notifications, unreadCount, setNotificationsFromAPI, setUnreadCountFromAPI } = useNotifications();
    const [showInbox, setShowInbox] = useState(false);
    const [recentToasts, setRecentToasts] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchNotifications();
        fetchUnreadCount();
        const interval = setInterval(() => {
            fetchNotifications();
            fetchUnreadCount();
        }, 10000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (notifications.length > 0) {
            const unreadNotifications = notifications.filter(n => !n.is_read);
            if (unreadNotifications.length > 0) {
                const latestUnread = unreadNotifications[0];
                setRecentToasts(prev => {
                    if (!prev.find(t => t.id === latestUnread.id)) {
                        return [latestUnread, ...prev].slice(0, 3);
                    }
                    return prev;
                });
            }
        }
    }, [notifications]);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const data = await notificationAPI.getNotifications(50);
            setNotificationsFromAPI(data.notifications);
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchUnreadCount = async () => {
        try {
            const data = await notificationAPI.getUnreadCount();
            setUnreadCountFromAPI(data.unread_count);
        } catch (error) {
            console.error('Failed to fetch unread count:', error);
        }
    };

    const removeToast = (notificationId) => {
        setRecentToasts(prev => prev.filter(t => t.id !== notificationId && t.notification_id !== notificationId));
    };

    return (
        <div className="notification-center">
            <div className="notification-toasts">
                {recentToasts.map(toast => (
                    <NotificationToast
                        key={toast.id || toast.notification_id}
                        notification={toast}
                        onClose={() => removeToast(toast.id || toast.notification_id)}
                    />
                ))}
            </div>

            <button
                className="notification-bell"
                onClick={() => setShowInbox(!showInbox)}
                title="Bildirimler"
            >
                N
                {unreadCount > 0 && (
                    <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
                )}
            </button>

            {showInbox && (
                <NotificationInbox
                    notifications={notifications}
                    loading={loading}
                    onClose={() => setShowInbox(false)}
                    onRefresh={fetchNotifications}
                />
            )}
        </div>
    );
};

export default NotificationCenter;
