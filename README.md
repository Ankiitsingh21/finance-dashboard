# Finance Dashboard

Simple finance tracking app with role-based access control. Built with Next.js 14, Prisma, and PostgreSQL.

## Getting Started

```bash
npm install
cp .env.example .env
```

Update `.env` with your database connection:
```
DATABASE_URL="postgresql://user:password@localhost:5432/finance_dashboard"
JWT_SECRET="change-this-in-production"
```

Run migrations and seed some test data:
```bash
npx prisma migrate dev --name init
npm run db:seed
```

Start the dev server:
```bash
npm run dev
```

Then open http://localhost:3000

## Test Accounts

All passwords are `Password123`

| Role | Email |
|------|-------|
| Admin | admin@example.com |
| Analyst | analyst@example.com |
| Viewer | viewer@example.com |

## Role Permissions

| Action | VIEWER | ANALYST | ADMIN |
|--------|--------|---------|-------|
| View records | Yes | Yes | Yes |
| Create/Edit/Delete records | No | No | Yes |
| View dashboard analytics | No | Yes | Yes |
| Manage users | No | No | Yes |

## API

### Auth

```
POST /api/auth/register
POST /api/auth/login
```

### Users (Admin only)

```
GET    /api/users
POST   /api/users
GET    /api/users/:id
PATCH  /api/users/:id
DELETE /api/users/:id
```

### Records

```
GET    /api/records         (all users)
POST   /api/records         (admin only)
GET    /api/records/:id     (all users)
PATCH  /api/records/:id     (admin only)
DELETE /api/records/:id     (admin only, soft delete)
```

Query params for `GET /api/records`:
- `page`, `limit` for pagination
- `type` - INCOME or EXPENSE
- `category` - filter by category name
- `startDate`, `endDate` - date range

### Dashboard (Analyst & Admin)

```
GET /api/dashboard/summary      (income/expense totals)
GET /api/dashboard/categories   (breakdown by category)
GET /api/dashboard/trends       (monthly trends, ?months=6)
GET /api/dashboard/recent       (recent records, ?limit=10)
```

## Response Format

Success:
```json
{ "success": true, "data": { ... } }
```

With pagination:
```json
{
  "success": true,
  "data": [...],
  "pagination": { "total": 100, "page": 1, "limit": 20, "totalPages": 5 }
}
```

Error:
```json
{ "success": false, "error": "Something went wrong" }
```

## Stack

- Next.js 14 (App Router)
- TypeScript
- PostgreSQL + Prisma
- JWT auth with bcrypt
- Tailwind CSS
- Zod validation

## Project Structure

```
src/
  app/
    api/          - API routes
    page.tsx      - Dashboard UI
  lib/
    auth.ts       - JWT stuff
    middleware.ts - Auth middleware
    errors.ts     - Error handling
    services/     - Business logic
  types/          - TypeScript types
prisma/
  schema.prisma   - Database schema
  seed.ts         - Seed script
```

## Notes

- Records use soft delete (deletedAt field)
- Passwords hashed with bcrypt
- JWT tokens expire in 7 days
- Amounts stored as Decimal for precision
