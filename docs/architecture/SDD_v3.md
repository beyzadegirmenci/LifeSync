# LifeSync – Software Design Document (SDD) v3

**Version:** 3.0
**Date:** 2025-03-29
**Status:** Final

---

## 1. Change Summary (v2 → v3)

- Ollama LLM service added to the component diagram
- Sequence diagrams added (Login flow, AI Plan generation flow)
- Deployment diagram added
- Builder Pattern included in the class diagram
- Profile update and AI plan interfaces defined

---

## 2. Architecture: Layered Architecture

### 2.1 Layers

| Layer | Technology | Responsibility |
|-------|------------|----------------|
| Presentation | React 19 + Vite | User interface, form management |
| Business Logic | Node.js + Express 5 | Auth, classification, AI integration |
| Data | PostgreSQL | User data persistence |
| External AI | Ollama (llama3.1:8b) | LLM-powered plan generation |

---

## 3. Component Diagram (Full Version)
```mermaid
graph TB
    subgraph PL["Presentation Layer"]
        subgraph FE["React Frontend (port 5173)"]
            AUTH_P["AuthPage"]
            DASH_P["Dashboard"]
            SURVEY_P["OnboardingSurvey"]
            PROFILE_P["EditProfile"]
            PROT_R["ProtectedRoute"]
        end
    end

    subgraph BL["Business Logic Layer"]
        subgraph BE["Express.js API (port 5000)"]
            MW["JWT Middleware"]
            AC["AuthController"]
            DC["DashboardController"]
            PC["ProfileController"]
            PB["ProfileBuilder"]
            SB["SqlUpdateBuilder"]
        end
    end

    subgraph DL["Data Layer"]
        UM["User Model"]
        DB[("PostgreSQL\nport 5432")]
    end

    subgraph EX["External Services"]
        OL["Ollama LLM\nport 11434\nllama3.1:8b"]
    end

    AUTH_P -->|"POST /auth/register|login"| AC
    DASH_P -->|"GET /dashboard"| DC
    SURVEY_P -->|"POST /dashboard/survey\nPOST /dashboard/diet-plan\nPOST /dashboard/exercise-plan"| DC
    PROFILE_P -->|"GET|PUT /profile"| PC
    PROT_R -.->|"token check?"| MW

    MW -.->|"protects"| DC
    MW -.->|"protects"| PC

    AC --> UM
    DC --> UM
    DC -->|"HTTP POST\n/api/generate"| OL
    PC --> PB
    PB --> SB
    PC --> UM
    UM -->|"SQL"| DB
```

---

## 4. Class Diagram (Full Version)
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

## 5. Sequence Diagrams

### 5.1 User Login Flow
```mermaid
sequenceDiagram
    actor U as User
    participant F as React Frontend
    participant B as Express Backend
    participant D as PostgreSQL

    U->>F: Enters email and password
    F->>F: Form validation
    F->>B: POST /api/auth/login {email, password}
    B->>D: SELECT * FROM users WHERE email = ?
    D-->>B: User record (if exists)
    B->>B: bcrypt.compare(password, hash)
    alt Password correct
        B-->>F: 200 OK {token, user}
        F->>F: localStorage.setItem('token', token)
        F-->>U: Redirect to Dashboard
    else Password incorrect
        B-->>F: 401 Unauthorized {error}
        F-->>U: Show error message
    end
```

---

### 5.2 AI-Powered Plan Generation Flow
```mermaid
sequenceDiagram
    actor U as User
    participant F as React Frontend
    participant B as Express Backend
    participant DB as PostgreSQL
    participant O as Ollama LLM

    U->>F: Fills out and submits the survey
    F->>B: POST /api/dashboard/survey (JWT)
    B->>B: Classification algorithm runs
    B->>DB: User level updated
    B-->>F: {classification: "Intermediate"}
    F-->>U: Result and plan buttons shown

    U->>F: Clicks "Generate Diet Plan"
    F->>F: Show loading state
    F->>B: POST /api/dashboard/diet-plan (JWT)
    B->>DB: Fetch user profile
    DB-->>B: {age, height, weight, goal, level...}
    B->>B: Build personalized prompt
    B->>O: POST /api/generate {model, prompt}
    alt Ollama reachable
        O-->>B: Personalized diet plan (stream)
        B-->>F: 200 OK {plan: "..."}
    else Ollama unreachable
        B->>B: Prepare fallback plan
        B-->>F: 200 OK {plan: "default recommendations"}
    end
    F-->>U: Plan displayed in modal
```

---

### 5.3 Profile Update Flow
```mermaid
sequenceDiagram
    actor U as User
    participant F as React Frontend
    participant B as Express Backend
    participant PB as ProfileBuilder
    participant SB as SqlUpdateBuilder
    participant DB as PostgreSQL

    U->>F: Edits profile fields
    F->>B: PUT /api/profile {height, weight, password...} (JWT)
    B->>PB: Create builder with update data
    PB->>PB: Validation for each field
    alt Validation failed
        PB-->>B: errors list
        B-->>F: 400 Bad Request {errors}
        F-->>U: Show error messages
    else Validation passed
        PB->>SB: SQL builder for valid fields
        SB->>SB: Build dynamic SET clause
        SB-->>B: {query, params}
        B->>DB: UPDATE users SET ... WHERE user_id = ?
        DB-->>B: Updated user
        B-->>F: 200 OK {user}
        F-->>U: Show success message
    end
```

---

## 6. Deployment Diagram
```mermaid
graph TB
    subgraph DEV["Developer Machine (localhost)"]
        subgraph BROWSER["Web Browser"]
            RC["React App\n:5173\n(Vite Dev Server)"]
        end

        subgraph NODE["Node.js Process"]
            API["Express.js API\n:5000"]
        end

        subgraph PG["PostgreSQL"]
            DB[("lifesync_db\n:5432")]
        end

        subgraph OLLAMA["Ollama Process"]
            LLM["LLM Engine\n:11434\nllama3.1:8b\n(Optional)"]
        end
    end

    RC -->|"HTTP/REST\nJSON"| API
    API -->|"TCP\nSQL (pg driver)"| DB
    API -->|"HTTP\n/api/generate"| LLM

    style LLM fill:#f9f,stroke:#333,stroke-dasharray: 5 5
```

> **Note:** The Ollama service is optional. When unavailable, the system continues in fallback mode.

---

## 7. Full Interface Definitions

### 7.1 Authentication

| Endpoint | Method | Auth | Input | Output |
|----------|--------|------|-------|--------|
| `/api/auth/register` | POST | No | `{first_name, last_name, email, password}` | `{token, user}` |
| `/api/auth/login` | POST | No | `{email, password}` | `{token, user}` |
| `/api/auth/logout` | POST | Yes | — | `{message}` |
| `/api/auth/me` | GET | Yes | — | `{user}` |

### 7.2 Dashboard & Survey

| Endpoint | Method | Auth | Input | Output |
|----------|--------|------|-------|--------|
| `/api/dashboard` | GET | Yes | — | `{user, metrics:{bmi, bmi_category,...}}` |
| `/api/dashboard/survey` | POST | Yes | `{age, gender, height, weight, goal, diet_preference, allergies, activity_level, exercise_frequency, sleep_hours, water_intake, screen_time, health_notes}` | `{classification, message}` |
| `/api/dashboard/diet-plan` | POST | Yes | — | `{plan: string}` |
| `/api/dashboard/exercise-plan` | POST | Yes | — | `{plan: string}` |

### 7.3 Profile

| Endpoint | Method | Auth | Input | Output |
|----------|--------|------|-------|--------|
| `/api/profile` | GET | Yes | — | `{user}` |
| `/api/profile` | PUT | Yes | `{current_password?, new_password?, height?, weight?, age?, gender?}` | `{user}` |

---

## 8. Design Patterns

| Pattern | Class | Purpose |
|---------|-------|---------|
| **Builder** | `ProfileBuilder` | Profile update validation and object construction |
| **Builder** | `SqlUpdateBuilder` | Dynamic SQL UPDATE query generation |
| **MVC** | Controller + Model + Route | Backend layer separation |
| **Middleware** | `JwtMiddleware` | Cross-cutting authentication logic |

---

## 9. Security Decisions

| Decision | Implementation |
|----------|----------------|
| Password hashing | bcrypt, 10 salt rounds |
| Token-based auth | JWT, 7-day TTL |
| SQL injection protection | Parameterized queries (pg prepared statements) |
| Stateless auth | Token stored in localStorage |
