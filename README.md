# Setup Instructions

## Hızlı Başlangıç

### 1. Repository'i Klonlayın
```bash
git clone https://github.com/beyzadegirmenci/LifeSync
cd LifeSync
```

### 2. Veritabanı Kurulumu
Backend/README.md dosyasındaki "Veritabanı Kurulumu" bölümünü takip edin.

### 3. Backend Kurulumu
Aşağıdaki adımları sırasıyla uygulayın:

```bash
# Backend klasörüne gidin
cd backend

# Paketleri kurun
npm install --legacy-peer-deps

# Backend sunucusunu başlatın (port 5000)
npm run dev
```

### 4. Frontend Kurulumu
Yeni bir terminal açın ve aşağıdaki adımları uygulayın:

```bash
# Frontend klasörüne gidin
cd frontend

# Paketleri kurun
npm install --legacy-peer-deps

# Frontend sunucusunu başlatın (port 5173)
npm run dev
```

## Sunucuları Başlatmak

### Terminal 1 - Backend
```bash
cd backend
npm run dev
# Çıktı: Server is running on http://localhost:5000
```

### Terminal 2 - Frontend
```bash
cd frontend
npm run dev
# Çıktı: Local: http://localhost:5173/
```

## Ollama Kurulumu (Opsiyonel)

Kişiye özel beslenme ve egzersiz planları üretmek için Ollama gereklidir:

1. https://ollama.ai adresinden Ollama'yı indirin
2. Ollama'yı başlatın
3. Model indirin: `ollama pull llama2` veya `ollama pull mistral`
4. Ollama'nın çalıştığından emin olun (http://localhost:11434)

Ollama olmadan da sistem çalışır, ancak AI tarafından oluşturulan planlar yerinde hata mesajı görülecektir.

## Erişim

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000
- **Ollama**: http://localhost:11434 (eğer kuruluysa)

## Sorun Giderme

### "Ollama servisi yanıt vermedi" hatası
- Ollama'nın çalıştığından emin olun
- `http://localhost:11434` adresine erişmeyi deneyin

### Port zaten kullanımda hatası
- Backend: `lsof -i :5000` ile kapatın veya port değiştirin
- Frontend: `lsof -i :5173` ile kapatın veya port değiştirin

### NPM paket kuruluyor çok uzun sürüyor
- `npm install --legacy-peer-deps` kullanın
- Cache temizleyin: `npm cache clean --force`
