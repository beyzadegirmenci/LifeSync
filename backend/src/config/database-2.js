const { Pool } = require('pg');

// JWT_SECRET gibi kritik env degerleri yoksa uygulamayi baslat
// DB baglantisi olmadan devam etmenin anlami yok
const requiredEnvVars = ['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'];
const missingVars = requiredEnvVars.filter((key) => !process.env[key]);
if (missingVars.length > 0) {
    console.error(`Eksik zorunlu environment degiskenleri: ${missingVars.join(', ')}`);
    process.exit(1);
}

// Production ortaminda SSL zorunlu, development'ta opsiyonel
const sslConfig =
    process.env.NODE_ENV === 'production'
        ? { rejectUnauthorized: false } // Heroku/Railway/Render icin
        : false;

const pool = new Pool({
    host:     process.env.DB_HOST,
    port:     parseInt(process.env.DB_PORT, 10),
    database: process.env.DB_NAME,
    user:     process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl:      sslConfig,

    // Baglanti havuzu limitleri
    max:             10,  // Ayni anda max 10 baglanti
    idleTimeoutMillis: 30000, // 30 sn bosta kalan baglanti kapatilir
    connectionTimeoutMillis: 5000, // 5 sn'de baglanamassa hata ver
});

// Pool seviyesindeki beklenmedik hatalari yakala
// (bu olmadan uygulama sessizce cokebilir)
pool.on('error', (err) => {
    console.error('PostgreSQL pool beklenmedik hata:', err.message);
    process.exit(1);
});

/**
 * Uygulama ayaga kalkarken cagrilir.
 * Basit bir ping yaparak baglantinin gercekten calistigini dogrular.
 */
const connectDB = async () => {
    try {
        const client = await pool.connect();
        await client.query('SELECT 1'); // Gercek sorgu ile dogrula
        console.log('PostgreSQL basariyla baglandi');
        client.release();
    } catch (error) {
        console.error('Veritabani baglantisi basarisiz:', error.message);
        process.exit(1);
    }
};

/**
 * Parametreli sorgu calistir.
 * @param {string} text   - SQL sorgusu
 * @param {Array}  params - Sorgu parametreleri
 */
const query = async (text, params) => {
    try {
        const result = await pool.query(text, params);
        return result;
    } catch (error) {
        // Ham DB hatasini yeniden firlatiyoruz; caller katmani nasil
        // isleyecegine kendisi karar verir (409 Conflict vs 500 gibi)
        console.error('Sorgu hatasi:', { text, error: error.message });
        throw error;
    }
};

module.exports = { pool, query, connectDB };
