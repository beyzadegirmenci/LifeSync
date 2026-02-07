const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
});

const connectDB = async () => {
    try {
        const client = await pool.connect();
        console.log('PostgreSQL connected successfully');
        client.release();
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
