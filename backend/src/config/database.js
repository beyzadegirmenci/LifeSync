const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
});

const ensureNotificationsTable = async () => {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS notifications (
            notification_id VARCHAR(36) PRIMARY KEY,
            user_id VARCHAR(36) NOT NULL,
            type VARCHAR(50) NOT NULL,
            title VARCHAR(255) NOT NULL,
            message TEXT NOT NULL,
            reference_id VARCHAR(36),
            is_read BOOLEAN NOT NULL DEFAULT FALSE,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            read_at TIMESTAMPTZ
        );
    `);

    await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_notifications_user_id
        ON notifications (user_id, created_at DESC);
    `);

    await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_notifications_unread
        ON notifications (user_id, is_read)
        WHERE is_read = FALSE;
    `);
};

const connectDB = async () => {
    try {
        const client = await pool.connect();
        console.log('PostgreSQL connected successfully');
        client.release();

        await ensureNotificationsTable();
    } catch (error) {
        console.error('Database connection failed:', error.message);
        process.exit(1);
    }
};

const query = async (text, params) => {
    try {
        const res = await pool.query(text, params);
        return res;
    } catch (error) {
        console.error('Query error:', error);
        throw error;
    }
};

module.exports = {
    pool,
    query,
    connectDB
};
