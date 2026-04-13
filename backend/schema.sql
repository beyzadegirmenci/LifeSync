-- LifeSync Veritabani Semasi
-- Calistirmak icin: psql -U <kullanici> -d <veritabani_adi> -f schema.sql

-- Uzantilari etkinlestir
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- USERS TABLOSU
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    user_id       UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
    email         VARCHAR(255)  NOT NULL UNIQUE,
    first_name    VARCHAR(100)  NOT NULL,
    last_name     VARCHAR(100)  NOT NULL,
    password      VARCHAR(255)  NOT NULL,

    -- Fiziksel bilgiler (kayit sirasinda opsiyonel)
    height        SMALLINT      CHECK (height IS NULL OR (height >= 1 AND height <= 300)),
    weight        SMALLINT      CHECK (weight IS NULL OR (weight >= 1 AND weight <= 500)),
    age           SMALLINT      CHECK (age IS NULL OR (age >= 1 AND age <= 150)),
    gender        VARCHAR(10)   CHECK (gender IS NULL OR gender IN ('male', 'female')),

    -- Fitness seviyesi: Strategy Pattern icin gerekli
    -- NULL = henuz survey tamamlanmamis
    level         VARCHAR(20)   CHECK (level IS NULL OR level IN ('beginner', 'intermediate', 'advanced')),

    -- Onboarding survey verileri (JSON olarak saklanir)
    profile_data  JSONB         DEFAULT NULL,

    created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- Email aramasi icin index (login'de her seferinde kullanilir)
CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);

-- Level bazli sorgular icin index (Strategy seciminde kullanilir)
CREATE INDEX IF NOT EXISTS idx_users_level ON users (level) WHERE level IS NOT NULL;

-- ============================================================
-- ROUTINES TABLOSU
-- ============================================================
CREATE TABLE IF NOT EXISTS routines (
    routine_id    UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id       UUID          NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,

    -- LLM'den gelen uretilmis plan icerigi
    content       TEXT          NOT NULL,

    -- Hangi fitness seviyesiyle uretildigini sakla
    -- (kullanicinin level'i sonradan degisebilir)
    level_at_creation VARCHAR(20) NOT NULL CHECK (level_at_creation IN ('beginner', 'intermediate', 'advanced')),

    -- Rutin turu: ilerleyen surumler icin
    routine_type  VARCHAR(20)   NOT NULL DEFAULT 'full'
                                CHECK (routine_type IN ('full', 'diet', 'exercise')),

    created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- Kullanici rutinlerini tarihe gore cekme (dashboard icin sik kullanilir)
CREATE INDEX IF NOT EXISTS idx_routines_user_id ON routines (user_id, created_at DESC);

-- ============================================================
-- NOTIFICATIONS TABLOSU (Observer Pattern)
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
    notification_id UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID          NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    
    -- Bildirim tipi: PlanCreated, ProfileUpdated, vb.
    type            VARCHAR(50)   NOT NULL,
    
    -- Bildirim içeriği
    title           VARCHAR(255)  NOT NULL,
    message         TEXT          NOT NULL,
    
    -- İlgili plan/routine ID si (opsiyonel)
    reference_id    UUID,
    
    -- Okundu/okunmadı durumu
    is_read         BOOLEAN       NOT NULL DEFAULT FALSE,
    
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    read_at         TIMESTAMPTZ
);

-- Kullanıcı bildirimlerini getir (sık sorgulanan endpoint için)
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications (user_id, created_at DESC);

-- Okunmamış bildirimleri hızlı bulmak için
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications (user_id, is_read) WHERE is_read = FALSE;

-- ============================================================
-- updated_at OTOMATIK GUNCELLEME
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();
