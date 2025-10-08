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

## 📊 Database

- **PostgreSQL** : `localhost:5432`
- **Adminer** : http://localhost:8080
- **Database** : `lehman_brothers`

## 🎯 Features

- Secure authentication (bcrypt + JWT)
- User management (Client/Director/Advisor)
- Modular and testable architecture
- Functional error handling