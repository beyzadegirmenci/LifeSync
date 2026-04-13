const Observer = require('./Observer');
const { pool } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class UserNotificationObserver extends Observer {
    constructor(userId) {
        super();
        this.userId = userId;
    }

    async update(eventData) {
        try {
            console.log(`[UserNotificationObserver] Updating notification for user ${this.userId}`);
            console.log(`[UserNotificationObserver] Event data:`, eventData);

            const query = `
                INSERT INTO notifications (notification_id, user_id, type, title, message, reference_id)
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING *;
            `;

            const result = await pool.query(query, [
                uuidv4(),
                this.userId,
                eventData.type,
                eventData.title,
                eventData.message,
                eventData.referenceId || null
            ]);

            console.log(`[UserNotificationObserver] Notification created:`, result.rows[0]);
            return result.rows[0];
        } catch (error) {
            console.error('[UserNotificationObserver] Error creating notification:', error.message);
            throw error;
        }
    }
}

module.exports = UserNotificationObserver;

