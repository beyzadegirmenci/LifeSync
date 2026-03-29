# Frontend Setup Guide

## Önkoşullar

- Node.js 20.19+ veya 22.12+
- npm 10.8+
- Backend servisi çalışır durumda olmalıdır

## Kurulum Adımları

### Adım 1: NPM Cache Temizliği
```bash
npm cache clean --force
```

### Adım 2: Frontend Klasörüne Gidin
```bash
cd LifeSync/frontend
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

### Adım 5: Sunucuyu Başlatın

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

## API Bağlantı Ayarları

Backend API bağlantısı `src/pages/OnboardingSurvey.jsx` ve `src/pages/Dashboard.jsx` dosyalarında tanımlanmıştır:

```javascript
const API_URL = 'http://localhost:5000/api';
```

Backend farklı bir portta çalışıyorsa bu değeri güncelleyin.

## Proje Yapısı

```
frontend/
├── public/              # Statik dosyalar
├── src/
│   ├── components/      # React komponentleri
│   │   └── ProtectedRoute.jsx
│   ├── pages/           # Sayfalar
│   │   ├── AuthPage.jsx
│   │   ├── Dashboard.jsx
│   │   ├── EditProfile.jsx
│   │   └── OnboardingSurvey.jsx
│   ├── styles/          # CSS dosyaları
│   ├── App.jsx          # Ana App komponenti
│   ├── App.css
│   ├── index.css
│   └── main.jsx
├── index.html
├── vite.config.js
└── eslint.config.js
```

## Özellikleri

- **React 19** - UI framework
- **React Router v7** - Yönlendirme
- **Axios** - HTTP istemcisi
- **Vite** - Hızlı geliştirme serveri
- **ESLint** - Kod kalite denetimi

## Önemli Notlar

### Vite Node.js Versyonu Uyarısı
Eğer aşağıdaki uyarıyı görürseniz, Node.js versiyonunuzu güncelleyin:

```
You are using Node.js 20.16.0. Vite requires Node.js version 20.19+ or 22.12+.
```

Uyarıya rağmen sistem çalışacaktır, ancak daha yeni bir Node.js sürümü kullanmanız önerilir.

### Authentication

Frontend otomatik olarak:
- JWT token'i `localStorage`'de saklar
- Her API isteğine `Authorization` header'ı ekler
- Geçersiz token'de otomatik olarak login sayfasına yönlendirir

### Sayfa Akışı

1. `/login` - Giriş ve kayıt (AuthPage)
2. `/survey` - Sağlık anketi (OnboardingSurvey)
3. `/dashboard` - Ana panel (Dashboard)
4. `/profile/edit` - Profil düzenleme (EditProfile)

## Sorun Giderme

### "Cannot GET /api/..." hatası
- Backend sunucusunun çalışıp çalışmadığını kontrol edin (`http://localhost:5000`)
- `API_URL` doğru portu gösteriyor mu kontrol edin

### Port 5173 zaten kullanımda
```bash
# Windows'ta:
netstat -ano | findstr :5173
taskkill /PID <PID> /F

# macOS/Linux'ta:
lsof -i :5173
kill -9 <PID>
```

### Node.js versyonu çok eski
```bash
# Geçerli versyonu kontrol et
node --version

# Güncellemek için:
# https://nodejs.org adresine gidin ve yeni sürümü indirin
```

### NPM paketleri çok uzun sürüyor
- `npm cache clean --force` işlemi yapın
- `--legacy-peer-deps` flag'ini kullanın
- Internet bağlantınızı kontrol edin
