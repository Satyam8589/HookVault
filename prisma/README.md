# Prisma Setup Guide

## 📋 Overview

This directory contains the Prisma ORM configuration for the Webhook Relay & Retry Service.

## 📁 Structure

```
prisma/
├── schema.prisma      # Database schema definition
├── seed.ts           # Database seeding script
└── migrations/       # Auto-generated migration files (created after first migration)
```

## 🗄️ Database Models

### **User**
- Stores user authentication information
- Has many webhooks

### **Webhook**
- Webhook URL registrations
- Associated with specific event types
- Can be enabled/disabled
- Belongs to a user

### **Event**
- Incoming webhook events
- Stores event type and payload
- Tracks delivery status (PENDING, DELIVERED, FAILED)

### **Delivery**
- Tracks individual delivery attempts
- Links events to webhooks
- Manages retry logic and status
- Stores HTTP responses and errors

## 🚀 Setup Instructions

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment

Create a `.env` file in the `backend/` directory:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/webhook_relay?schema=public"
```

### 3. Start PostgreSQL

**Option A: Using Docker**
```bash
docker run --name webhook-postgres \
  -e POSTGRES_USER=user \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=webhook_relay \
  -p 5432:5432 \
  -d postgres:15
```

**Option B: Using docker-compose**
```bash
docker-compose up -d
```

### 4. Generate Prisma Client

```bash
npx prisma generate
```

### 5. Run Migrations

```bash
npx prisma migrate dev --name init
```

This will:
- Create the database schema
- Generate migration files in `prisma/migrations/`
- Update the Prisma Client

### 6. Seed the Database (Optional)

```bash
npx prisma db seed
```

This creates:
- 2 test users (john@example.com, jane@example.com)
- 3 webhook registrations
- 2 sample events
- 2 delivery records

**Test credentials:**
- Email: `john@example.com`
- Password: `password123`

## 🔧 Useful Commands

### View Database in Prisma Studio
```bash
npx prisma studio
```
Opens a GUI at `http://localhost:5555` to browse and edit data.

### Reset Database
```bash
npx prisma migrate reset
```
⚠️ **Warning:** This deletes all data and re-runs migrations + seed.

### Create a New Migration
```bash
npx prisma migrate dev --name <migration_name>
```

### Apply Migrations in Production
```bash
npx prisma migrate deploy
```

### Format Schema File
```bash
npx prisma format
```

### Validate Schema
```bash
npx prisma validate
```

## 📊 Database Indexes

The schema includes indexes on frequently queried fields:

- `User.email` (unique)
- `Webhook.userId`
- `Event.type`
- `Event.status`
- `Event.createdAt`
- `Delivery.eventId`
- `Delivery.webhookId`
- `Delivery.status`
- `Delivery.nextRetryAt`

## 🔄 Migration Workflow

1. **Modify** `schema.prisma`
2. **Run** `npx prisma migrate dev --name <description>`
3. **Review** generated migration in `prisma/migrations/`
4. **Commit** both schema and migration files
5. **Deploy** using `npx prisma migrate deploy` in production

## 🧪 Testing with Prisma

For testing, you can use a separate test database:

```typescript
// test/setup.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.TEST_DATABASE_URL,
    },
  },
});
```

## 📝 Schema Conventions

- **Table names**: Plural, lowercase (e.g., `users`, `webhooks`)
- **Model names**: Singular, PascalCase (e.g., `User`, `Webhook`)
- **Field names**: camelCase (e.g., `createdAt`, `userId`)
- **Enums**: PascalCase (e.g., `EventStatus`, `DeliveryStatus`)

## 🔐 Security Notes

- Passwords are hashed using bcrypt (see `seed.ts`)
- Never commit `.env` file
- Use environment variables for sensitive data
- Implement row-level security in production

## 📚 Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Prisma Best Practices](https://www.prisma.io/docs/guides/performance-and-optimization)

## 🐛 Troubleshooting

### "Can't reach database server"
- Ensure PostgreSQL is running
- Check `DATABASE_URL` in `.env`
- Verify port 5432 is not blocked

### "Migration failed"
- Check for syntax errors in `schema.prisma`
- Ensure database is accessible
- Try `npx prisma migrate reset` (⚠️ deletes data)

### "Prisma Client not generated"
- Run `npx prisma generate`
- Restart your IDE/TypeScript server

### Seed script fails
- Ensure migrations are applied first
- Check bcrypt is installed: `npm install bcrypt`
- Verify database is empty or use `--skip-seed` flag
