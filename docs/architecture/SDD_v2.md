# LifeSync – Yazılım Tasarım Dokümanı (SDD) v2

**Versiyon:** 2.0
**Tarih:** 2025-03-15
**Durum:** Güncel (Sprint 1 sonrası güncelleme)

---

## 1. Değişiklik Özeti (v1 → v2)

- Bileşen diyagramı detaylandırıldı: JWT Middleware bileşeni eklendi
- Sınıf diyagramı eklendi (User modeli, Controller'lar)
- Arayüz input/output parametreleri tanımlandı
- Dashboard ve anket bileşenleri eklendi

---

## 2. Mimari: Katmanlı Mimari (Layered Architecture)

Seçim v1'den itibaren aynıdır. 3 ana katman:

1. **Sunum Katmanı** → React SPA (port 5173)
2. **İş Mantığı Katmanı** → Express.js API (port 5000)
3. **Veri Katmanı** → PostgreSQL (port 5432)

---

## 3. Detaylı Bileşen Diyagramı

```mermaid
graph TB
    subgraph PL["🖥️ Sunum Katmanı"]
        subgraph FE["React Frontend"]
            AUTH_P["AuthPage\n(Login/Register)"]
            DASH_P["Dashboard\n(Sağlık Metrikleri)"]
            SURVEY_P["OnboardingSurvey\n(Sağlık Anketi)"]
            PROFILE_P["EditProfile\n(Profil Düzenle)"]
            PROT_R["ProtectedRoute\n(Guard)"]
        end
    end

    subgraph BL["⚙️ İş Mantığı Katmanı"]
        subgraph BE["Express.js API Server"]
            MW["JWT Middleware\n(Kimlik Doğrulama)"]
            AC["AuthController\n(/api/auth)"]
            DC["DashboardController\n(/api/dashboard)"]
            PC["ProfileController\n(/api/profile)"]
        end
    end

    subgraph DL["🗄️ Veri Katmanı"]
        UM["User Model\n(CRUD)"]
        DB[("PostgreSQL\nusers tablosu")]
    end

    AUTH_P -->|"POST /auth/register\nPOST /auth/login"| AC
    DASH_P -->|"GET /dashboard"| DC
    SURVEY_P -->|"POST /dashboard/survey"| DC
    PROFILE_P -->|"GET|PUT /profile"| PC
    PROT_R -->|"token kontrolü"| MW

    MW -->|"JWT doğrulama"| AC
    MW -->|"JWT doğrulama"| DC
    MW -->|"JWT doğrulama"| PC

    AC --> UM
    DC --> UM
    PC --> UM
    UM -->|"SQL"| DB
```

---

## 4. Sınıf Diyagramı

```mermaid
classDiagram
    class User {
        +String user_id
        +String email
        +String first_name
        +String last_name
        +String password
        +Integer height
        +Integer weight
        +Integer age
        +String gender
        +create(userData) Promise~User~
        +findByEmail(email) Promise~User~
        +findById(id) Promise~User~
        +updateProfile(id, data) Promise~User~
        +comparePassword(plain, hash) Promise~Boolean~
    }

    class AuthController {
        +register(req, res) void
        +login(req, res) void
        +logout(req, res) void
        +getMe(req, res) void
    }

    class DashboardController {
        +getDashboard(req, res) void
        +processSurvey(req, res) void
    }

    class ProfileController {
        +getProfile(req, res) void
        +updateProfile(req, res) void
    }

    class JwtMiddleware {
        +authenticate(req, res, next) void
    }

    AuthController --> User : kullanır
    DashboardController --> User : kullanır
    ProfileController --> User : kullanır
    JwtMiddleware ..> AuthController : korur
    JwtMiddleware ..> DashboardController : korur
    JwtMiddleware ..> ProfileController : korur
```

---

## 5. Arayüz Tanımları

### 5.1 POST /api/auth/register

**Input:**
```json
{
  "first_name": "string (zorunlu)",
  "last_name": "string (zorunlu)",
  "email": "string (zorunlu, unique)",
  "password": "string (zorunlu, min 6 karakter)"
}
```

**Output (200 OK):**
```json
{
  "message": "Kayıt başarılı",
  "token": "JWT_TOKEN",
  "user": {
    "user_id": "uuid",
    "email": "string",
    "first_name": "string",
    "last_name": "string"
  }
}
```

---

### 5.2 POST /api/auth/login

**Input:**
```json
{
  "email": "string (zorunlu)",
  "password": "string (zorunlu)"
}
```

**Output (200 OK):**
```json
{
  "message": "Giriş başarılı",
  "token": "JWT_TOKEN",
  "user": { "user_id": "...", "email": "...", "first_name": "...", "last_name": "..." }
}
```

**Output (401 Unauthorized):**
```json
{ "error": "Geçersiz email veya şifre" }
```

---

### 5.3 GET /api/dashboard

**Header:** `Authorization: Bearer <token>`

**Output (200 OK):**
```json
{
  "user": { "first_name": "...", "last_name": "...", "email": "..." },
  "metrics": {
    "bmi": 22.5,
    "bmi_category": "Normal",
    "height": 170,
    "weight": 65,
    "age": 25,
    "gender": "female"
  }
}
```

---

### 5.4 POST /api/dashboard/survey

**Header:** `Authorization: Bearer <token>`

**Input:**
```json
{
  "age": "integer",
  "gender": "string",
  "height": "integer (cm)",
  "weight": "integer (kg)",
  "goal": "string",
  "diet_preference": "string",
  "allergies": "string",
  "activity_level": "string",
  "exercise_frequency": "integer",
  "sleep_hours": "integer",
  "water_intake": "float",
  "screen_time": "integer",
  "health_notes": "string"
}
```

**Output (200 OK):**
```json
{
  "classification": "Beginner | Intermediate | Advanced",
  "message": "Sınıflandırma mesajı"
}
```

---

## 6. Veritabanı Şeması

```sql
CREATE TABLE users (
    user_id    VARCHAR(36)  PRIMARY KEY,
    email      VARCHAR(255) NOT NULL UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name  VARCHAR(100) NOT NULL,
    password   VARCHAR(255) NOT NULL,
    height     INTEGER,
    weight     INTEGER,
    age        INTEGER,
    gender     VARCHAR(10)
);
```

---

*Sonraki versiyon: Ollama entegrasyonu, sequence diyagramları ve deployment diyagramı eklenecektir.*
