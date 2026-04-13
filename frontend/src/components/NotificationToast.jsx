import React, { useEffect } from 'react';
import { useNotifications } from '../hooks/useNotifications';
import { notificationAPI } from '../api/notificationAPI';
import '../styles/NotificationToast.css';

const NotificationToast = ({ notification, onClose }) => {
    const { markAsRead } = useNotifications();

    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 3000);
        return () => clearTimeout(timer);
    }, [onClose]);

    const handleClick = async () => {
        try {
            const notificationId = notification.notification_id || notification.id;
            if (!notification.is_read) {
                await notificationAPI.markAsRead(notificationId);
                markAsRead(notificationId);
            }
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const getTypeColor = (type) => {
        const colors = {
            'PlanCreated': '#4CAF50',
            'PlanUpdated': '#2196F3',
            'ProfileUpdated': '#FF9800',
            'GoalMissed': '#f44336',
            'default': '#666'
        };
        return colors[type] || colors['default'];
    };

    return (
        <div
            className="notification-toast"
            onClick={handleClick}
            style={{ borderLeftColor: getTypeColor(notification.type) }}
        >
            <div className="notification-toast-header">
                <span className="notification-type-badge">{notification.type}</span>
                <button className="notification-close-btn" onClick={(e) => {
                    e.stopPropagation();
                    onClose();
                }}>×</button>
            </div>
            <div className="notification-toast-title">{notification.title}</div>
            <div className="notification-toast-message">{notification.message}</div>
            <div className="notification-toast-time">
                {new Date(notification.created_at).toLocaleTimeString('tr-TR')}
            </div>
        </div>
    );
};

export default NotificationToast;
