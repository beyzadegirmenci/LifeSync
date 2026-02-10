const { query } = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');

const SALT_ROUNDS = 10;

const User = {
    
    async create({ email, firstName, lastName, password, height, weight, age, gender }) {
        const userId = uuidv4();
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

        const result = await query(
            `INSERT INTO users (user_id, email, first_name, last_name, password, height, weight, age, gender)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             RETURNING user_id, email, first_name, last_name, height, weight, age, gender`,
            [userId, email, firstName, lastName, hashedPassword, height || null, weight || null, age || null, gender || null]
        );

        return result.rows[0];
    },

    
    async findByEmail(email) {
        const result = await query(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );
        return result.rows[0] || null;
    },

    
    async findById(userId) {
        const result = await query(
            'SELECT user_id, email, first_name, last_name, height, weight, age, gender FROM users WHERE user_id = $1',
            [userId]
        );
        return result.rows[0] || null;
    },

    
    async updateProfile(userId, { password, height, weight, age, gender }) {
        const fields = [];
        const values = [];
        let paramIndex = 1;

        if (password) {
            const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
            fields.push(`password = $${paramIndex++}`);
            values.push(hashedPassword);
        }
        if (height !== undefined) {
            fields.push(`height = $${paramIndex++}`);
            values.push(height || null);
        }
        if (weight !== undefined) {
            fields.push(`weight = $${paramIndex++}`);
            values.push(weight || null);
        }
        if (age !== undefined) {
            fields.push(`age = $${paramIndex++}`);
            values.push(age || null);
        }
        if (gender !== undefined) {
            fields.push(`gender = $${paramIndex++}`);
            values.push(gender || null);
        }

        if (fields.length === 0) {
            return this.findById(userId);
        }

        values.push(userId);
        const result = await query(
            `UPDATE users SET ${fields.join(', ')} WHERE user_id = $${paramIndex}
             RETURNING user_id, email, first_name, last_name, height, weight, age, gender`,
            values
        );

        return result.rows[0];
    },

    
    async comparePassword(plainPassword, hashedPassword) {
        return bcrypt.compare(plainPassword, hashedPassword);
    }
};

module.exports = User;
