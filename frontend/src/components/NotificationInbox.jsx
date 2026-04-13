import React, { useState } from 'react';
import { useNotifications } from '../hooks/useNotifications';
import { notificationAPI } from '../api/notificationAPI';
import '../styles/NotificationInbox.css';

const NotificationInbox = ({ notifications, loading, onClose, onRefresh }) => {
    const { markAsRead } = useNotifications();
    const [filter, setFilter] = useState('all');

    const handleMarkAsRead = async (notificationId) => {
        try {
            await notificationAPI.markAsRead(notificationId);
            markAsRead(notificationId);
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const filteredNotifications = filter === 'unread'
        ? notifications.filter(n => !n.is_read)
        : notifications;

    const getTypeIcon = (type) => {
        const icons = {
            'PlanCreated': 'NEW',
            'PlanUpdated': 'UPD',
            'ProfileUpdated': 'USR',
            'GoalMissed': 'WARN',
            'SurveyCompleted': 'FORM',
            'default': 'INFO'
        };
        return icons[type] || icons['default'];
    };

    return (
        <div className="notification-inbox-overlay" onClick={onClose}>
            <div className="notification-inbox" onClick={(e) => e.stopPropagation()}>
                <div className="notification-inbox-header">
                    <h2>Bildirimler</h2>
                    <button className="notification-close-btn" onClick={onClose}>×</button>
                </div>

                <div className="notification-inbox-filters">
                    <button
                        className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                        onClick={() => setFilter('all')}
                    >
                        Tümü ({notifications.length})
                    </button>
                    <button
                        className={`filter-btn ${filter === 'unread' ? 'active' : ''}`}
                        onClick={() => setFilter('unread')}
                    >
                        Okunmamış ({notifications.filter(n => !n.is_read).length})
                    </button>
                    <button className="refresh-btn" onClick={onRefresh} disabled={loading}>
                        {loading ? 'Yukleniyor' : 'Yenile'}
                    </button>
                </div>

                <div className="notification-inbox-list">
                    {filteredNotifications.length === 0 ? (
                        <div className="notification-empty">
                            <p>Bildirim bulunamadi</p>
                        </div>
                    ) : (
                        filteredNotifications.map(notif => (
                            <div
                                key={notif.notification_id || notif.id}
                                className={`notification-inbox-item ${notif.is_read ? 'read' : 'unread'}`}
                            >
                                <div className="notification-inbox-icon">
                                    {getTypeIcon(notif.type)}
                                </div>
                                <div className="notification-inbox-content">
                                    <div className="notification-inbox-title">{notif.title}</div>
                                    <div className="notification-inbox-message">{notif.message}</div>
                                    <div className="notification-inbox-time">
                                        {new Date(notif.created_at).toLocaleString('tr-TR')}
                                    </div>
                                </div>
                                {!notif.is_read && (
                                    <button
                                        className="notification-mark-read"
                                        onClick={() => handleMarkAsRead(notif.notification_id || notif.id)}
                                        title="Okundu olarak işaretle"
                                    >
                                        OK
                                    </button>
                                )}
                            </div>
                        ))
                    )}
                </div>

                <div className="notification-inbox-footer">
                    <small>Son güncelleme: {new Date().toLocaleTimeString('tr-TR')}</small>
                </div>
            </div>
        </div>
    );
};

export default NotificationInbox;
