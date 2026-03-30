# LifeSync – Yazılım Tasarım Dokümanı (SDD) v3

**Versiyon:** 3.0
**Tarih:** 2025-03-29
**Durum:** Final

---

## 1. Değişiklik Özeti (v2 → v3)

- Ollama LLM servisi bileşen diyagramına eklendi
- Sequence diyagramları eklendi (Login akışı, AI Plan üretimi akışı)
- Deployment diyagramı eklendi
- Builder Pattern sınıf diyagramına dahil edildi
- Profil güncelleme ve AI plan arayüzleri tanımlandı

---

## 2. Mimari: Katmanlı Mimari (Layered Architecture)

### 2.1 Katmanlar

| Katman | Teknoloji | Sorumluluk |
|--------|-----------|------------|
| Sunum | React 19 + Vite | Kullanıcı arayüzü, form yönetimi |
| İş Mantığı | Node.js + Express 5 | Auth, sınıflandırma, AI entegrasyonu |
| Veri | PostgreSQL | Kullanıcı verisi kalıcılığı |
| Harici AI | Ollama (llama3.1:8b) | LLM destekli plan üretimi |

---

## 3. Bileşen Diyagramı (Tam Versiyon)

```mermaid
graph TB
    subgraph PL["🖥️ Sunum Katmanı"]
        subgraph FE["React Frontend (port 5173)"]
            AUTH_P["AuthPage"]
            DASH_P["Dashboard"]
            SURVEY_P["OnboardingSurvey"]
            PROFILE_P["EditProfile"]
            PROT_R["ProtectedRoute"]
        end
    end

    subgraph BL["⚙️ İş Mantığı Katmanı"]
        subgraph BE["Express.js API (port 5000)"]
            MW["JWT Middleware"]
            AC["AuthController"]
            DC["DashboardController"]
            PC["ProfileController"]
            PB["ProfileBuilder"]
            SB["SqlUpdateBuilder"]
        end
    end

    subgraph DL["🗄️ Veri Katmanı"]
        UM["User Model"]
        DB[("PostgreSQL\nport 5432")]
    end

    subgraph EX["🤖 Harici Servisler"]
        OL["Ollama LLM\nport 11434\nllama3.1:8b"]
    end

    AUTH_P -->|"POST /auth/register|login"| AC
    DASH_P -->|"GET /dashboard"| DC
    SURVEY_P -->|"POST /dashboard/survey\nPOST /dashboard/diet-plan\nPOST /dashboard/exercise-plan"| DC
    PROFILE_P -->|"GET|PUT /profile"| PC
    PROT_R -.->|"token var mı?"| MW

    MW -.->|"korur"| DC
    MW -.->|"korur"| PC

    AC --> UM
    DC --> UM
    DC -->|"HTTP POST\n/api/generate"| OL
    PC --> PB
    PB --> SB
    PC --> UM
    UM -->|"SQL"| DB
```

---

## 4. Sınıf Diyagramı (Tam Versiyon)

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
        +findByEmailSafe(email) Promise~User~
        +findById(id) Promise~User~
        +updateProfile(id, data) Promise~User~
        +comparePassword(plain, hash) Promise~Boolean~
    }

    class ProfileBuilder {
        -Object updates
        -List errors
        +setPassword(current, newPass, confirm) ProfileBuilder
        +setHeight(height) ProfileBuilder
        +setWeight(weight) ProfileBuilder
        +setAge(age) ProfileBuilder
        +setGender(gender) ProfileBuilder
        +build() Object
        +hasErrors() Boolean
        +getErrors() List
    }

    class SqlUpdateBuilder {
        -List setClauses
        -List values
        -Integer paramCount
        +add(column, value) SqlUpdateBuilder
        +build(table, whereCol, whereVal) Object
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
        +generateDietPlan(req, res) void
        +generateExercisePlan(req, res) void
        -classifyUser(surveyData) String
        -calculateBMI(height, weight) Float
        -buildPrompt(userProfile, type) String
        -callOllama(prompt) Promise~String~
        -getFallbackPlan(type) String
    }

    class ProfileController {
        +getProfile(req, res) void
        +updateProfile(req, res) void
    }

    class JwtMiddleware {
        +authenticate(req, res, next) void
    }

    AuthController --> User
    DashboardController --> User
    ProfileController --> User
    ProfileController --> ProfileBuilder
    ProfileBuilder --> SqlUpdateBuilder
    JwtMiddleware ..> DashboardController
    JwtMiddleware ..> ProfileController
```

---

## 5. Sequence Diyagramları

### 5.1 Kullanıcı Giriş Akışı

```mermaid
sequenceDiagram
    actor U as Kullanıcı
    participant F as React Frontend
    participant B as Express Backend
    participant D as PostgreSQL

    U->>F: Email ve şifre girer
    F->>F: Form validasyonu
    F->>B: POST /api/auth/login {email, password}
    B->>D: SELECT * FROM users WHERE email = ?
    D-->>B: User kaydı (varsa)
    B->>B: bcrypt.compare(password, hash)
    alt Şifre doğru
        B-->>F: 200 OK {token, user}
        F->>F: localStorage.setItem('token', token)
        F-->>U: Dashboard sayfasına yönlendir
    else Şifre hatalı
        B-->>F: 401 Unauthorized {error}
        F-->>U: Hata mesajı göster
    end
```

---

### 5.2 AI Destekli Plan Üretimi Akışı

```mermaid
sequenceDiagram
    actor U as Kullanıcı
    participant F as React Frontend
    participant B as Express Backend
    participant DB as PostgreSQL
    participant O as Ollama LLM

    U->>F: Anketi doldurur ve gönderir
    F->>B: POST /api/dashboard/survey (JWT)
    B->>B: Sınıflandırma algoritması çalışır
    B->>DB: Kullanıcı seviyesi güncellenir
    B-->>F: {classification: "Intermediate"}
    F-->>U: Sonuç ve plan butonları gösterilir

    U->>F: "Diyet Planı Oluştur" tıklar
    F->>F: Loading durumu göster
    F->>B: POST /api/dashboard/diet-plan (JWT)
    B->>DB: Kullanıcı profili çekilir
    DB-->>B: {yaş, boy, kilo, hedef, seviye...}
    B->>B: Kişiselleştirilmiş prompt oluşturulur
    B->>O: POST /api/generate {model, prompt}
    alt Ollama erişilebilir
        O-->>B: Kişiselleştirilmiş diyet planı (stream)
        B-->>F: 200 OK {plan: "..."}
    else Ollama erişilemez
        B->>B: Fallback plan hazırlanır
        B-->>F: 200 OK {plan: "varsayılan öneriler"}
    end
    F-->>U: Plan modal'ında gösterilir
```

---

### 5.3 Profil Güncelleme Akışı

```mermaid
sequenceDiagram
    actor U as Kullanıcı
    participant F as React Frontend
    participant B as Express Backend
    participant PB as ProfileBuilder
    participant SB as SqlUpdateBuilder
    participant DB as PostgreSQL

    U->>F: Profil alanlarını düzenler
    F->>B: PUT /api/profile {height, weight, password...} (JWT)
    B->>PB: Güncelleme verileriyle builder oluştur
    PB->>PB: Her alan için validasyon
    alt Validasyon hatalı
        PB-->>B: errors listesi
        B-->>F: 400 Bad Request {errors}
        F-->>U: Hata mesajları göster
    else Validasyon geçti
        PB->>SB: Geçerli alanlar için SQL builder
        SB->>SB: Dinamik SET cümleciği oluştur
        SB-->>B: {query, params}
        B->>DB: UPDATE users SET ... WHERE user_id = ?
        DB-->>B: Güncellenmiş kullanıcı
        B-->>F: 200 OK {user}
        F-->>U: Başarı mesajı göster
    end
```

---

## 6. Deployment Diyagramı

```mermaid
graph TB
    subgraph DEV["💻 Geliştirici Makinesi (localhost)"]
        subgraph BROWSER["🌐 Web Tarayıcısı"]
            RC["React App\n:5173\n(Vite Dev Server)"]
        end

        subgraph NODE["⬢ Node.js Process"]
            API["Express.js API\n:5000"]
        end

        subgraph PG["🐘 PostgreSQL"]
            DB[("lifesync_db\n:5432")]
        end

        subgraph OLLAMA["🤖 Ollama Process"]
            LLM["LLM Engine\n:11434\nllama3.1:8b\n(İsteğe Bağlı)"]
        end
    end

    RC -->|"HTTP/REST\nJSON"| API
    API -->|"TCP\nSQL (pg driver)"| DB
    API -->|"HTTP\n/api/generate"| LLM

    style LLM fill:#f9f,stroke:#333,stroke-dasharray: 5 5
```

> **Not:** Ollama servisi isteğe bağlıdır. Çalışmadığında sistem fallback modda devam eder.

---

## 7. Tüm Arayüz Tanımları

### 7.1 Kimlik Doğrulama

| Endpoint | Method | Auth | Input | Output |
|----------|--------|------|-------|--------|
| `/api/auth/register` | POST | Hayır | `{first_name, last_name, email, password}` | `{token, user}` |
| `/api/auth/login` | POST | Hayır | `{email, password}` | `{token, user}` |
| `/api/auth/logout` | POST | Evet | — | `{message}` |
| `/api/auth/me` | GET | Evet | — | `{user}` |

### 7.2 Dashboard & Anket

| Endpoint | Method | Auth | Input | Output |
|----------|--------|------|-------|--------|
| `/api/dashboard` | GET | Evet | — | `{user, metrics:{bmi, bmi_category,...}}` |
| `/api/dashboard/survey` | POST | Evet | `{age, gender, height, weight, goal, diet_preference, allergies, activity_level, exercise_frequency, sleep_hours, water_intake, screen_time, health_notes}` | `{classification, message}` |
| `/api/dashboard/diet-plan` | POST | Evet | — | `{plan: string}` |
| `/api/dashboard/exercise-plan` | POST | Evet | — | `{plan: string}` |

### 7.3 Profil

| Endpoint | Method | Auth | Input | Output |
|----------|--------|------|-------|--------|
| `/api/profile` | GET | Evet | — | `{user}` |
| `/api/profile` | PUT | Evet | `{current_password?, new_password?, height?, weight?, age?, gender?}` | `{user}` |

---

## 8. Tasarım Desenleri

| Desen | Sınıf | Kullanım Amacı |
|-------|-------|----------------|
| **Builder** | `ProfileBuilder` | Profil güncelleme validasyonu ve nesne inşası |
| **Builder** | `SqlUpdateBuilder` | Dinamik SQL UPDATE sorgusu oluşturma |
| **MVC** | Controller + Model + Route | Backend katman ayrımı |
| **Middleware** | `JwtMiddleware` | Kesişen kimlik doğrulama mantığı |

---

## 9. Güvenlik Kararları

| Karar | Uygulama |
|-------|----------|
| Şifre hashleme | bcrypt, 10 salt round |
| Token tabanlı auth | JWT, 7 gün TTL |
| SQL injection koruması | Parametreli sorgular (pg prepared statements) |
| Stateless auth | Token localStorage'da tutulur |
