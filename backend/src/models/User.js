// Model seviyesinde Builder Pattern kullaniyoruz:
// guncellenecek kolonlar SqlUpdateBuilder ile dinamik olarak uretiliyor.
const { query } = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');
const SqlUpdateBuilder = require('../builders/SqlUpdateBuilder');

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
            'SELECT user_id, email, first_name, last_name, height, weight, age, gender, level, profile_data FROM users WHERE user_id = $1',
            [userId]
        );
        return result.rows[0] || null;
    },

    
    async updateLevel(userId, level) {
        const validLevels = ['beginner', 'intermediate', 'advanced'];
        if (!validLevels.includes(level)) {
            throw new Error(`Gecersiz level degeri: ${level}`);
        }

        const result = await query(
            `UPDATE users
             SET level = $1
             WHERE user_id = $2
             RETURNING user_id, email, first_name, last_name, height, weight, age, gender, level, profile_data`,
            [level, userId]
        );
        return result.rows[0] || null;
    },

    
    async updateProfile(userId, { password, height, weight, age, gender }) {
        const updateBuilder = new SqlUpdateBuilder();

        if (password) {
            const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
            updateBuilder.addField('password', hashedPassword);
        }
        if (height !== undefined) {
            updateBuilder.addField('height', height);
        }
        if (weight !== undefined) {
            updateBuilder.addField('weight', weight);
        }
        if (age !== undefined) {
            updateBuilder.addField('age', age);
        }
        if (gender !== undefined) {
            updateBuilder.addField('gender', gender);
        }

        if (updateBuilder.isEmpty()) {
            return this.findById(userId);
        }

        const builtQuery = updateBuilder.build('user_id', userId);
        const result = await query(
            `UPDATE users SET ${builtQuery.setClause} WHERE user_id = $${builtQuery.whereParamIndex}
             RETURNING user_id, email, first_name, last_name, height, weight, age, gender, level`,
            builtQuery.values
        );

        return result.rows[0];
    },

    
    async comparePassword(plainPassword, hashedPassword) {
        return bcrypt.compare(plainPassword, hashedPassword);
    }
};

module.exports = User;
