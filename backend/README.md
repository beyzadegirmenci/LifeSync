# Backend Setup Guide

## Veritabanı Kurulumu (PostgreSQL)

### Önkoşullar
- PostgreSQL 18.1+ yüklü olmalıdır
- PostgreSQL servisi çalışır durumda olmalıdır

### Adımlar

1. **PostgreSQL'e Bağlanın**
```bash
psql -U postgres
# Parolanızı girin
```

2. **Veritabanı Oluşturun**
```sql
CREATE DATABASE lifesync;
```

3. **Yeni Kullanıcı Oluşturun**
```sql
CREATE USER pattern WITH password 'pattern';
```

4. **İzinleri Verin**
```sql
GRANT ALL PRIVILEGES ON DATABASE lifesync TO pattern;
\c lifesync
GRANT ALL ON SCHEMA public TO pattern;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO pattern;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO pattern;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO pattern;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO pattern;
```

5. **Bağlantıyı Test Edin**
```bash
\q
psql -U pattern -d lifesync
```

### Veritabanı Tabloları

Aşağıdaki tablolar otomatik olarak oluşturulur:

```sql
CREATE TABLE users (
    user_id    VARCHAR(36)  PRIMARY KEY,
    email      VARCHAR(255) NOT NULL UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name  VARCHAR(100) NOT NULL,
    password   VARCHAR(255) NOT NULL
);
```

## Backend Kurulumu

### Adım 1: NPM Cache Temizliği
```bash
npm cache clean --force
```

### Adım 2: Backend Klasörüne Gidin
```bash
cd LifeSync/backend
```

### Adım 3: Eski Paketleri Temizleyin (İlk Kurulumsa gerekli değil)
```bash
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
rm -r package-lock.json -ErrorAction SilentlyContinue
```

### Adım 4: Paketleri Kurun
```bash
npm install --legacy-peer-deps
```

### Adım 5: .env Dosyasını Oluşturun
```bash
# .env.example dosyasını kopyalayın
cp .env.example .env

# .env dosyasını düzenleyin ve veritabanı bilgilerini ekleyin:
# DATABASE_URL=postgresql://pattern:pattern@localhost:5432/lifesync
# OLLAMA_URL=http://localhost:11434/api/generate (opsiyonel)
# JWT_SECRET=your_secret_key
```

### Adım 6: Backend Sunucusunu Başlatın

**Geliştirme Modu** (otomatik restart ile):
```bash
npm run dev
```

**Üretim Modu**:
```bash
npm start
```

Backend sunucusu `http://localhost:5000` adresinde çalışacaktır.

## API Endpoints

- `GET /health` - Sunucu durumu kontrol
- `POST /api/auth/register` - Kullanıcı kaydı
- `POST /api/auth/login` - Kullanıcı giriş
- `GET /api/dashboard` - Dashboard verisi
- `POST /api/dashboard/survey` - Sağlık anketi
- `POST /api/dashboard/diet-plan` - Beslenme planı (Ollama gerekli)
- `POST /api/dashboard/exercise-plan` - Egzersiz planı (Ollama gerekli)

## Sorun Giderme

### "PostgreSQL bağlantısı başarısız" hatası
- PostgreSQL servisi çalışıp çalışmadığını kontrol edin
- `.env` dosyasındaki veritabanı bilgilerini kontrol edin
- Kullanıcı ve parola doğru mu kontrol edin

### "Ollama servisi yanıt vermedi" hatası
- Ollama kurulu ve çalışır durumda olup olmadığını kontrol edin
- `http://localhost:11434` adresine erişmeyi deneyin
- Ollama olmadan sistem kısmi olarak çalışır (AI planları hata verir)

### Port 5000 zaten kullanımda
```bash
# Windows'ta: port'ı kullanan process'i bul ve kapat
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# macOS/Linux'ta:
lsof -i :5000
kill -9 <PID>
```

### NPM paketleri çok uzun sürüyor
- `npm cache clean --force` işlemi yapın
- `--legacy-peer-deps` flag'ini kullanın
- Internet bağlantınızı kontrol edin

