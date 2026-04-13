import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const notificationAPI = {
    getNotifications: async (limit = 50, offset = 0, read = null) => {
        try {
            const params = new URLSearchParams({ limit, offset });
            if (read !== null) params.append('read', read);

            const response = await axios.get(`${API_BASE}/dashboard/notifications?${params}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                }
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching notifications:', error);
            throw error;
        }
    },

    getUnreadCount: async () => {
        try {
            const response = await axios.get(`${API_BASE}/dashboard/notifications/unread/count`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                }
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching unread count:', error);
            throw error;
        }
    },

    markAsRead: async (notificationId) => {
        try {
            const response = await axios.post(
                `${API_BASE}/dashboard/notifications/${notificationId}/read`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );
            return response.data;
        } catch (error) {
            console.error('Error marking notification as read:', error);
            throw error;
        }
    }
};
