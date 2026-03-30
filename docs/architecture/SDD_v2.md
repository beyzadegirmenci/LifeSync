# LifeSync – Software Design Document (SDD) v2

**Version:** 2.0
**Date:** 2025-03-15
**Status:** Current (Post-Sprint 1 Update)

---

## 1. Change Summary (v1 → v2)

- Component diagram expanded: JWT Middleware component added
- Class diagram added (User model, Controllers)
- Interface input/output parameters defined
- Dashboard and survey components added

---

## 2. Architecture: Layered Architecture

The selection remains the same as v1. 3 main layers:

1. **Presentation Layer** → React SPA (port 5173)
2. **Business Logic Layer** → Express.js API (port 5000)
3. **Data Layer** → PostgreSQL (port 5432)

---

## 3. Detailed Component Diagram
```mermaid
graph TB
    subgraph PL["Presentation Layer"]
        subgraph FE["React Frontend"]
            AUTH_P["AuthPage\n(Login/Register)"]
            DASH_P["Dashboard\n(Health Metrics)"]
            SURVEY_P["OnboardingSurvey\n(Health Questionnaire)"]
            PROFILE_P["EditProfile\n(Edit Profile)"]
            PROT_R["ProtectedRoute\n(Guard)"]
        end
    end

    subgraph BL["Business Logic Layer"]
        subgraph BE["Express.js API Server"]
            MW["JWT Middleware\n(Authentication)"]
            AC["AuthController\n(/api/auth)"]
            DC["DashboardController\n(/api/dashboard)"]
            PC["ProfileController\n(/api/profile)"]
        end
    end

    subgraph DL["Data Layer"]
        UM["User Model\n(CRUD)"]
        DB[("PostgreSQL\nusers table")]
    end

    AUTH_P -->|"POST /auth/register\nPOST /auth/login"| AC
    DASH_P -->|"GET /dashboard"| DC
    SURVEY_P -->|"POST /dashboard/survey"| DC
    PROFILE_P -->|"GET|PUT /profile"| PC
    PROT_R -->|"token check"| MW

    MW -->|"JWT validation"| AC
    MW -->|"JWT validation"| DC
    MW -->|"JWT validation"| PC

    AC --> UM
    DC --> UM
    PC --> UM
    UM -->|"SQL"| DB
```

---

## 4. Class Diagram
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

    AuthController --> User : uses
    DashboardController --> User : uses
    ProfileController --> User : uses
    JwtMiddleware ..> AuthController : protects
    JwtMiddleware ..> DashboardController : protects
    JwtMiddleware ..> ProfileController : protects
```

---

## 5. Interface Definitions

### 5.1 POST /api/auth/register

**Input:**
```json
{
  "first_name": "string (required)",
  "last_name": "string (required)",
  "email": "string (required, unique)",
  "password": "string (required, min 6 characters)"
}
```

**Output (200 OK):**
```json
{
  "message": "Registration successful",
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
  "email": "string (required)",
  "password": "string (required)"
}
```

**Output (200 OK):**
```json
{
  "message": "Login successful",
  "token": "JWT_TOKEN",
  "user": { "user_id": "...", "email": "...", "first_name": "...", "last_name": "..." }
}
```

**Output (401 Unauthorized):**
```json
{ "error": "Invalid email or password" }
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
  "message": "Classification message"
}
```

---

## 6. Database Schema
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

*Next version: Ollama integration, sequence diagrams, and deployment diagram will be added.*
