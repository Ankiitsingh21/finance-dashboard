# Finance Dashboard

A backend-focused finance tracking system with role-based access control, built with Next.js 14 App Router. Each user role gets a different level of access — admins manage everything, analysts view insights, viewers read records only.

> The frontend is minimal and exists purely to demonstrate the API works end-to-end. The real work is in the backend.

**Live Demo:** [finance-dashboard-ankiit.vercel.app](https://finance-dashboard.vercel.app)  
**GitHub:** [Ankiitsingh21/finance-dashboard](https://github.com/Ankiitsingh21/finance-dashboard)

---

## Screenshots

![Login](docs/login.png)

*Login page with test credentials shown for easy evaluation*

![Admin Dashboard](docs/admin-summary.png)

*Admin view — full dashboard access with INR totals across all records*

![Records with CRUD](docs/admin-records.png)

*Admin-only Create / Edit / Delete on each record row*

![Viewer Restriction](docs/viewer-notice.png)

*Viewer role — locked out of dashboard, records tab only*

---

## Tech Stack

- **Next.js 14** (App Router) — API routes as service boundaries
- **TypeScript** — strict mode throughout
- **PostgreSQL + Prisma v7** — with `PrismaPg` adapter for Neon serverless
- **JWT + bcryptjs** — stateless auth, passwords hashed with 10 salt rounds
- **Zod** — runtime request validation with field-level error messages
- **Tailwind CSS** — minimal frontend

---

## Getting Started

```bash
git clone https://github.com/Ankiitsingh21/finance-dashboard.git
cd finance-dashboard
npm install
cp .env.example .env
```

Fill in `.env`:
```env
DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"
JWT_SECRET="your-secret-key"
```

```bash
npx prisma migrate dev --name init
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

> **Note:** Use Node.js 20. Node 24 has compatibility issues with Next.js 14 on Windows.

---

## Test Accounts

Password for all: `Password123`

| Role | Email |
|------|-------|
| Admin | admin@example.com |
| Analyst | analyst@example.com |
| Viewer | viewer@example.com |

---

## Role Permissions

| Action | VIEWER | ANALYST | ADMIN |
|--------|:------:|:-------:|:-----:|
| View records | ✅ | ✅ | ✅ |
| View dashboard analytics | ❌ | ✅ | ✅ |
| Create / Edit / Delete records | ❌ | ❌ | ✅ |
| Manage users | ❌ | ❌ | ✅ |

---

## API Reference

All protected routes require: `Authorization: Bearer <token>`

### Auth
```
POST /api/auth/register
POST /api/auth/login
```

### Records
```
GET    /api/records              → all authenticated users
POST   /api/records              → admin only
GET    /api/records/:id          → all authenticated users
PATCH  /api/records/:id          → admin only
DELETE /api/records/:id          → admin only (soft delete)
```

Query params for `GET /api/records`:
```
type        INCOME | EXPENSE
category    string (case-insensitive)
startDate   YYYY-MM-DD
endDate     YYYY-MM-DD
page        default 1
limit       default 20
```

### Dashboard (Analyst + Admin)
```
GET /api/dashboard/summary       income, expenses, net balance, count
GET /api/dashboard/categories    breakdown per category
GET /api/dashboard/trends        monthly trends (?months=6, max 24)
GET /api/dashboard/recent        latest records (?limit=10, max 50)
```

### Users (Admin only)
```
GET    /api/users
POST   /api/users
GET    /api/users/:id
PATCH  /api/users/:id
DELETE /api/users/:id
```

### Response Format
```json
// Success
{ "success": true, "data": { } }

// Paginated
{ "success": true, "data": [], "pagination": { "total": 108, "page": 1, "limit": 20, "totalPages": 6 } }

// Error
{ "success": false, "error": "Unauthorized" }

// Validation error
{ "success": false, "error": "Validation failed", "errors": { "email": ["Invalid email"] } }
```

---

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── auth/           register, login
│   │   ├── records/        CRUD + filtering
│   │   ├── dashboard/      summary, categories, trends, recent
│   │   └── users/          user management
│   └── page.tsx            minimal frontend UI
├── lib/
│   ├── auth.ts             JWT sign / verify / extract
│   ├── middleware.ts        withAuth, withRole HOFs
│   ├── errors.ts           AppError + centralized errorResponse
│   ├── prisma.ts           singleton Prisma client
│   └── services/
│       ├── user.service.ts
│       ├── record.service.ts
│       └── dashboard.service.ts
└── types/index.ts
```

---

## Design Decisions

**Service layer** — route handlers don't touch the DB. All queries go through service files. Keeps routes thin and logic testable.

**HOF middleware** — `withAuth` and `withRole` are higher-order functions that wrap handlers. `withRole` composes on top of `withAuth` so auth logic isn't repeated across routes.

**Soft delete** — records get a `deletedAt` timestamp instead of being hard deleted. All queries filter `deletedAt: null`. Preserves audit history.

**Decimal type** — amounts use Prisma's `Decimal` instead of `Float` to avoid floating point issues on financial data. Converted to `number` only at the response layer.

**Zod validation** — schemas live co-located with each route. Returns structured field-level errors, not generic 400s.

---

## Scripts

```bash
npm run dev          # development server
npm run build        # production build
npm run db:migrate   # run migrations
npm run db:seed      # seed test data
```