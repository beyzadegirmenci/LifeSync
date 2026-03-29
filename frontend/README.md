# Frontend Setup Guide

## Önkoşullar

- Node.js 20.19+ veya 22.12+
- npm 10.8+
- Backend servisi çalışır durumda olmalıdır

## Kurulum Adımları

### Adım 1: Frontend Klasörüne Gidin
```bash
cd LifeSync/frontend
```

### Adım 2: Paketleri Kurun
```bash
npm install --legacy-peer-deps
```

### Adım 3: Sunucuyu Başlatın

Geliştirme modu (Hot module reloading ile):
```bash
npm run dev
```

Frontend sunucusu `http://localhost:5173` adresinde çalışacaktır.

## Kullanılabilir Komutlar

```bash
# Geliştirme sunucusunu başlat
npm run dev

# Production build oluştur
npm run build

# Build'ı önizle
npm run preview

# ESLint ile kodu kontrol et
npm run lint
```

