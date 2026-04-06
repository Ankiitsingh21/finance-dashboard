# Finance Dashboard

A full-stack finance tracking application with role-based access control. Built this to learn Next.js 14 App Router patterns, Prisma v7 with serverless Postgres, and proper service layer architecture. It handles income/expense tracking with different permission levels for admins, analysts, and viewers.

**Live Demo:** [GitHub Repository](https://github.com/Ankiitsingh21/finance-dashboard)

## Screenshots

### Login Page
![Login](docs/login.png)

### Admin View
Full access - can view dashboard analytics and manage all records.

![Admin Summary](docs/admin-summary.png)
![Admin Records](docs/admin-records.png)
![Admin Categories](docs/admin-categories.png)
![Admin Recent Activity](docs/admin-recent.png)

### Analyst View
Can view dashboard analytics and records, but cannot create/edit/delete.

![Analyst Summary](docs/analyst-summary.png)
![Analyst Records](docs/analyst-records.png)

### Viewer View
Limited to viewing records only. Dashboard tabs are hidden.

![Viewer Records](docs/viewer-records.png)
![Viewer Notice](docs/viewer-notice.png)

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Database | PostgreSQL (Neon serverless) |
| ORM | Prisma v7 with PrismaPg adapter |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| Validation | Zod |
| Styling | Tailwind CSS |
| Currency | INR (Indian Rupees) |

## Getting Started

### Prerequisites
- Node.js 20+ (v24 has issues with Next.js 14 on Windows)
- PostgreSQL database (or Neon account)

### Setup

1. Clone the repo
```bash
git clone https://github.com/Ankiitsingh21/finance-dashboard.git
cd finance-dashboard
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp .env.example .env
```

4. Update `.env` with your database URL and JWT secret

5. Run database migrations
```bash
npx prisma migrate dev --name init
```

6. Seed the database with test data
```bash
npm run db:seed
```

7. Start the dev server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Environment Variables

Create a `.env` file in the root directory:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/finance_dashboard?sslmode=require"
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
```

For Neon, the DATABASE_URL will look something like:
```env
DATABASE_URL="postgresql://username:password@ep-xxx-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require"
```

## Test Accounts

All accounts use password: `Password123`

| Role | Email | Access Level |
|------|-------|--------------|
| Admin | admin@example.com | Full CRUD + User management |
| Analyst | analyst@example.com | View dashboard + records |
| Viewer | viewer@example.com | View records only |

## Role Permissions

| Action | VIEWER | ANALYST | ADMIN |
|--------|:------:|:-------:|:-----:|
| View financial records | Yes | Yes | Yes |
| View dashboard (Summary, Categories, Recent) | No | Yes | Yes |
| Create records | No | No | Yes |
| Edit records | No | No | Yes |
| Delete records (soft delete) | No | No | Yes |
| Manage users | No | No | Yes |

## API Reference

All endpoints return JSON. Protected routes require `Authorization: Bearer <token>` header.

### Authentication

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | Create new account | No |
| POST | `/api/auth/login` | Login, returns JWT | No |

**Register/Login Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "Password123"
}
```

### Users (Admin only)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | List all users (paginated) |
| POST | `/api/users` | Create user |
| GET | `/api/users/:id` | Get user by ID |
| PATCH | `/api/users/:id` | Update user (name, role, status) |
| DELETE | `/api/users/:id` | Delete user |

### Financial Records

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/records` | List records (paginated, filterable) | All authenticated |
| POST | `/api/records` | Create record | Admin only |
| GET | `/api/records/:id` | Get record by ID | All authenticated |
| PATCH | `/api/records/:id` | Update record | Admin only |
| DELETE | `/api/records/:id` | Soft delete record | Admin only |

**Query Parameters for GET `/api/records`:**
- `page` - Page number (default: 1)
- `limit` - Records per page (default: 20)
- `type` - Filter by INCOME or EXPENSE
- `category` - Filter by category name
- `startDate` - Filter from date (YYYY-MM-DD)
- `endDate` - Filter to date (YYYY-MM-DD)

**Create/Update Record Body:**
```json
{
  "amount": 50000,
  "type": "INCOME",
  "category": "Salary",
  "date": "2026-03-01",
  "notes": "March salary"
}
```

### Dashboard (Analyst & Admin)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard/summary` | Total income, expenses, net balance, record count |
| GET | `/api/dashboard/categories` | Income/expense breakdown by category |
| GET | `/api/dashboard/trends?months=6` | Monthly income/expense trends |
| GET | `/api/dashboard/recent?limit=10` | Recent financial activity |

## Response Format

**Success Response:**
```json
{
  "success": true,
  "data": { ... }
}
```

**Success with Pagination:**
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "total": 108,
    "page": 1,
    "limit": 20,
    "totalPages": 6
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Error message here"
}
```

**Validation Error:**
```json
{
  "success": false,
  "error": "Validation failed",
  "errors": {
    "email": ["Invalid email address"],
    "password": ["Password must be at least 8 characters"]
  }
}
```

## Project Structure

```
finance-dashboard/
├── docs/                      # Screenshots
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── seed.ts                # Seed script
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   ├── login/route.ts
│   │   │   │   └── register/route.ts
│   │   │   ├── dashboard/
│   │   │   │   ├── categories/route.ts
│   │   │   │   ├── recent/route.ts
│   │   │   │   ├── summary/route.ts
│   │   │   │   └── trends/route.ts
│   │   │   ├── records/
│   │   │   │   ├── [id]/route.ts
│   │   │   │   └── route.ts
│   │   │   └── users/
│   │   │       ├── [id]/route.ts
│   │   │       └── route.ts
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx           # Dashboard UI
│   ├── lib/
│   │   ├── auth.ts            # JWT sign/verify/extract
│   │   ├── errors.ts          # AppError class + errorResponse
│   │   ├── middleware.ts      # withAuth, withRole HOFs
│   │   ├── prisma.ts          # Prisma client singleton
│   │   └── services/
│   │       ├── dashboard.service.ts
│   │       ├── record.service.ts
│   │       └── user.service.ts
│   ├── types/
│   │   └── index.ts           # TypeScript interfaces
│   └── generated/
│       └── prisma/            # Generated Prisma client
├── .env.example
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

## Design Decisions

### Service Layer Pattern
Routes don't touch the database directly. All DB operations go through service functions (`user.service.ts`, `record.service.ts`, `dashboard.service.ts`). This keeps routes thin and makes testing easier.

### Higher-Order Function Middleware
Instead of traditional middleware, I used HOFs that wrap route handlers:
- `withAuth(handler)` - Validates JWT, checks user exists and is active
- `withRole(...roles)(handler)` - Chains with withAuth, checks role permissions

This pattern works well with Next.js App Router where you can't use traditional middleware per-route.

### Soft Delete
Records aren't actually deleted - they get a `deletedAt` timestamp. All queries filter out soft-deleted records by default. Good for audit trails and accidental deletion recovery.

### Decimal for Money
Financial amounts use Prisma's `Decimal` type instead of `Float`. Avoids floating point precision issues (0.1 + 0.2 !== 0.3 problem). Converted to `number` only at the API response layer.

### Zod Validation
All request bodies are validated with Zod schemas before processing. Returns structured error messages with field-level details. Catches issues early before hitting the database.

### JWT in Authorization Header
Tokens are passed as `Bearer <token>` in the Authorization header, not cookies. Simpler for API-first design and works well with any client (mobile, desktop, etc.).

## Scripts

```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run db:migrate   # Run Prisma migrations
npm run db:seed      # Seed database with test data
npm run db:push      # Push schema changes (no migration)
```

## Notes

- Passwords are hashed with bcrypt (10 salt rounds)
- JWT tokens expire in 7 days
- All amounts displayed in INR with Indian number formatting
- The frontend is a minimal dashboard for testing the API - not meant to be production UI
- Prisma v7 requires the PrismaPg adapter for Neon/serverless PostgreSQL

## License

MIT
