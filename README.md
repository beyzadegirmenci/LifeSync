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
```

### Terminal 2 - Frontend
```bash
cd frontend
npm run dev
```

## Ollama Kurulumu (Opsiyonel)

Kişiye özel beslenme ve egzersiz planları üretmek için Ollama gereklidir:

1. https://ollama.ai adresinden Ollama'yı indirin
2. Ollama'yı başlatın
3. Model indirin (hız için önerilen): `ollama pull llama3.2:3b`
4. `backend/.env` dosyasına ekleyin: `OLLAMA_MODEL=llama3.2:3b`
5. Ollama'nın çalıştığından emin olun (http://localhost:11434)

## Erişim

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000
- **Ollama**: http://localhost:11434 (eğer kuruluysa)
