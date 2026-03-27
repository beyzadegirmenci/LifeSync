// Model seviyesinde Builder Pattern kullaniyoruz:
// guncellenecek kolonlar SqlUpdateBuilder ile dinamik olarak uretiliyor.
const { query } = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');
const SqlUpdateBuilder = require('../builders/SqlUpdateBuilder');

const SALT_ROUNDS = 10;

// Hassas alanlar disinda donecek kolon listesi
// (password'u hic getirme — sadece login akisinda findByEmailWithPassword kullanilir)
const SAFE_COLUMNS = `
    user_id, email, first_name, last_name,
    height, weight, age, gender,
    level, profile_data,
    created_at, updated_at
`;

const User = {

    /**
     * Yeni kullanici olusturur.
     * height/weight/age/gender kayit sirasinda opsiyoneldir.
     */
    async create({ email, firstName, lastName, password, height, weight, age, gender }) {
        const userId = uuidv4();
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

        const result = await query(
            `INSERT INTO users
                (user_id, email, first_name, last_name, password, height, weight, age, gender)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             RETURNING ${SAFE_COLUMNS}`,
            [
                userId,
                email.toLowerCase().trim(),
                firstName.trim(),
                lastName.trim(),
                hashedPassword,
                height  || null,
                weight  || null,
                age     || null,
                gender  || null,
            ]
        );

        return result.rows[0];
    },

    /**
     * Login akisi icin kullanilir — password hash'ini de dondurur.
     * Baska hicbir yerde kullanilmamali.
     */
    async findByEmailWithPassword(email) {
        const result = await query(
            'SELECT * FROM users WHERE email = $1',
            [email.toLowerCase().trim()]
        );
        return result.rows[0] || null;
    },

    /**
     * Guvenli email sorgusu — password dondurmez.
     * "Bu email kayitli mi?" kontrolu icin kullanilir.
     */
    async findByEmail(email) {
        const result = await query(
            `SELECT ${SAFE_COLUMNS} FROM users WHERE email = $1`,
            [email.toLowerCase().trim()]
        );
        return result.rows[0] || null;
    },

    /**
     * ID ile kullanici getirir — password dondurmez.
     */
    async findById(userId) {
        const result = await query(
            `SELECT ${SAFE_COLUMNS} FROM users WHERE user_id = $1`,
            [userId]
        );
        return result.rows[0] || null;
    },

    /**
     * Fitness seviyesini gunceller (survey tamamlandiginda cagirilir).
     * Strategy Pattern bu degerle hangi algoritmaya gidecegine karar verir.
     */
    async updateLevel(userId, level) {
        const validLevels = ['beginner', 'intermediate', 'advanced'];
        if (!validLevels.includes(level)) {
            throw new Error(`Gecersiz level degeri: ${level}`);
        }

        const result = await query(
            `UPDATE users
             SET level = $1
             WHERE user_id = $2
             RETURNING ${SAFE_COLUMNS}`,
            [level, userId]
        );
        return result.rows[0] || null;
    },

    /**
     * Survey verisini JSON olarak saklar.
     * LLM prompt'u olustururken kullanilabilir.
     */
    async updateProfileData(userId, profileData) {
        const result = await query(
            `UPDATE users
             SET profile_data = $1
             WHERE user_id = $2
             RETURNING ${SAFE_COLUMNS}`,
            [JSON.stringify(profileData), userId]
        );
        return result.rows[0] || null;
    },

    /**
     * Profil alanlarini gunceller (password, height, weight, age, gender).
     * SqlUpdateBuilder ile dinamik SQL uretilir — bos gelen alanlar guncellenmez.
     */
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

        // Hicbir alan guncellenmeyecekse mevcut kullaniciyi dondur
        if (updateBuilder.isEmpty()) {
            return this.findById(userId);
        }

        const builtQuery = updateBuilder.build('user_id', userId);
        const result = await query(
            `UPDATE users
             SET ${builtQuery.setClause}
             WHERE ${builtQuery.whereColumn} = $${builtQuery.whereParamIndex}
             RETURNING ${SAFE_COLUMNS}`,
            builtQuery.values
        );
        return result.rows[0] || null;
    },

    /**
     * Sifre dogrulama yardimcisi.
     */
    async comparePassword(plainPassword, hashedPassword) {
        return bcrypt.compare(plainPassword, hashedPassword);
    },
};

module.exports = User;
