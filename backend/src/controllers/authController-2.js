const jwt = require('jsonwebtoken');
const User = require('../models/User');

// JWT_SECRET yoksa uygulama baslamasin — hardcoded fallback kaldirildi
if (!process.env.JWT_SECRET) {
    console.error('HATA: JWT_SECRET environment degiskeni tanimli degil.');
    process.exit(1);
}

const JWT_SECRET     = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// API response'larinda donecek kullanici alanlari
const formatUser = (user) => ({
    userId:      user.user_id,
    email:       user.email,
    firstName:   user.first_name,
    lastName:    user.last_name,
    height:      user.height,
    weight:      user.weight,
    age:         user.age,
    gender:      user.gender,
    level:       user.level,       // Strategy Pattern icin gerekli
    profileData: user.profile_data,
});

const authController = {

    async register(req, res) {
        try {
            const { email, firstName, lastName, password, height, weight, age, gender } = req.body;

            if (!email || !firstName || !lastName || !password) {
                return res.status(400).json({ error: 'Email, ad, soyad ve sifre zorunludur' });
            }

            if (password.length < 6) {
                return res.status(400).json({ error: 'Sifre en az 6 karakter olmalidir' });
            }

            // Email benzersizlik kontrolu — guvensiz findByEmail kullaniliyor (password yok)
            const existingUser = await User.findByEmail(email);
            if (existingUser) {
                return res.status(409).json({ error: 'Bu email zaten kayitli' });
            }

            const user = await User.create({ email, firstName, lastName, password, height, weight, age, gender });
            const token = jwt.sign({ userId: user.user_id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

            res.status(201).json({
                message: 'Kayit basarili',
                token,
                user: formatUser(user),
            });
        } catch (error) {
            console.error('Register hatasi:', error);
            res.status(500).json({ error: 'Kayit islemi basarisiz' });
        }
    },

    async login(req, res) {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                return res.status(400).json({ error: 'Email ve sifre zorunludur' });
            }

            // Login akisinda password hash'ini de getirmemiz gerekiyor
            const user = await User.findByEmailWithPassword(email);
            if (!user) {
                return res.status(401).json({ error: 'Gecersiz email veya sifre' });
            }

            const isMatch = await User.comparePassword(password, user.password);
            if (!isMatch) {
                return res.status(401).json({ error: 'Gecersiz email veya sifre' });
            }

            const token = jwt.sign({ userId: user.user_id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

            res.json({
                message: 'Giris basarili',
                token,
                user: formatUser(user),
            });
        } catch (error) {
            console.error('Login hatasi:', error);
            res.status(500).json({ error: 'Giris islemi basarisiz' });
        }
    },

    async logout(req, res) {
        // JWT stateless oldugu icin sunucu tarafinda token iptal edilemiyor.
        // Gercek bir blacklist icin Redis entegrasyonu gerekir (ilerleyen surum).
        // Su an client-side token silme yeterli kabul ediliyor.
        res.json({ message: 'Cikis basarili' });
    },

    async me(req, res) {
        try {
            const user = await User.findById(req.userId);
            if (!user) {
                return res.status(404).json({ error: 'Kullanici bulunamadi' });
            }
            res.json({ user: formatUser(user) });
        } catch (error) {
            console.error('Me hatasi:', error);
            res.status(500).json({ error: 'Kullanici bilgisi alinamadi' });
        }
    },
};

module.exports = authController;
