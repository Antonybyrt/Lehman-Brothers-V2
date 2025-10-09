# Lehman Brothers V2

Modern banking application built with Clean Architecture and TypeScript.

## 🏗️ Architecture

- **Clean Architecture** : Domain/Application/Infrastructure separation
- **TypeScript** : Static typing and safety
- **Prisma ORM** : Database management
- **Express.js** : Web backend framework
- **PostgreSQL** : Relational database
- **Docker** : Containerization

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start database
docker-compose up -d

# Generate Prisma client
npx prisma generate --schema=infrastructure/server/prisma/schema.prisma

# Sync Prisma schema with database
DATABASE_URL="postgresql://lehman_user:lehman_password@localhost:5432/lehman_brothers" npx prisma db push --schema=infrastructure/server/prisma/schema.prisma

# Start server
cd infrastructure/server/ npm run dev
```

## 🔐 API Endpoints

- `GET /health` - Health check
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `GET /confirm-email/:token` - Email confirmation
- `GET /auth/me` - Get current user info (Protected)
- `GET /auth/getrole` - Get current user role (Protected)
- `GET /email-status` - Get email confirmation status (Protected)
- `POST /accounts` - Create new account (Protected)
- `GET /accounts` - Get user accounts (Protected)

## 📊 Database

- **PostgreSQL** : `localhost:5432`
- **Adminer** : http://localhost:8080
- **Database** : `lehman_brothers`

## 🎯 Features

- Secure authentication (bcrypt + JWT)
- Email confirmation for registration
- User management (Client/Director/Advisor)
- Account creation with unique IBAN generation
- Role-based access control
- Clean Code & Functional Programming practices
- Scalable and maintainable architecture
- Functional error handling