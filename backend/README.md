# Database Setup

```bash
# Make sure PostgreSQL is installed with minimum version of 18.1

# Login with admin to postgres
psql -U postgres # Password must be selected at the setup.

# Create database
CREATE DATABASE lifesync;

# Create new user
CREATE USER pattern WITH password 'pattern'

# Give all the permissions to new user
GRANT ALL PRIVILEGES ON DATABASE lifesync TO pattern;
\c lifesync
GRANT ALL ON SCHEMA public TO pattern;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO pattern;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO pattern;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO pattern;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO pattern;

# Then quit with \q and test it:
psql -U pattern -d lifesync
```

## Database Tables

```sql
CREATE TABLE users (
    user_id    VARCHAR(36)  PRIMARY KEY,
    email      VARCHAR(255) NOT NULL UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name  VARCHAR(100) NOT NULL,
    password   VARCHAR(255) NOT NULL
);
```

# Backend Setup

```bash

# Change path
cd LifeSync/backend

# Install packages
npm install

# Create your own .env file and copy the field from .env.example, then fill it with your own credentials.
cp .env.example .env
# Then edit the new .env file


# Run backend
cd backend
node server.js
```

