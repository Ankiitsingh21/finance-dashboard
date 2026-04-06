# Finance Dashboard

A complete Finance Data Processing and Access Control Backend built with Next.js 14 App Router and TypeScript. This application provides a robust API for managing financial records with role-based access control (RBAC).

## Architecture Overview

```
finance-dashboard/
├── prisma/                    # Database schema and migrations
│   ├── schema.prisma          # Prisma schema definition
│   └── seed.ts                # Database seeding script
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── api/               # API Routes
│   │   │   ├── auth/          # Authentication endpoints
│   │   │   ├── users/         # User management endpoints
│   │   │   ├── records/       # Financial records endpoints
│   │   │   └── dashboard/     # Dashboard analytics endpoints
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Dashboard UI
│   ├── lib/                   # Core libraries
│   │   ├── prisma.ts          # Prisma client singleton
│   │   ├── auth.ts            # JWT authentication helpers
│   │   ├── middleware.ts      # Auth & role middleware
│   │   ├── errors.ts          # Error handling utilities
│   │   └── services/          # Business logic services
│   └── types/                 # TypeScript type definitions
└── .env.example               # Environment variables template
```

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Validation**: Zod
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcryptjs
- **Styling**: Tailwind CSS

## Setup Instructions

### Prerequisites

- Node.js 18+ installed
- PostgreSQL database running
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd finance-dashboard
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your database credentials:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/finance_dashboard?schema=public"
   JWT_SECRET="your-super-secret-jwt-key-change-in-production"
   NEXT_PUBLIC_API_URL=""
   ```

4. **Run database migrations**
   ```bash
   npx prisma migrate dev --name init
   ```

5. **Seed the database** (creates test users and sample data)
   ```bash
   npm run db:seed
   ```

6. **Start the development server**
   ```bash
   npm run dev
   ```

7. Open [http://localhost:3000](http://localhost:3000) in your browser

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/finance_dashboard` |
| `JWT_SECRET` | Secret key for JWT signing | `your-super-secret-key` |
| `NEXT_PUBLIC_API_URL` | API base URL (optional) | `http://localhost:3000` |

## Role Permissions

| Action | VIEWER | ANALYST | ADMIN |
|--------|--------|---------|-------|
| View records | ✅ | ✅ | ✅ |
| Create records | ❌ | ❌ | ✅ |
| Update records | ❌ | ❌ | ✅ |
| Delete records | ❌ | ❌ | ✅ |
| View dashboard | ❌ | ✅ | ✅ |
| Manage users | ❌ | ❌ | ✅ |

## Test Accounts

After running the seed script, you can use these accounts:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@example.com | Password123 |
| Analyst | analyst@example.com | Password123 |
| Viewer | viewer@example.com | Password123 |

## API Endpoints

### Authentication

#### Register a new user
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "Password123",
    "role": "VIEWER"
  }'
```

#### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "Password123"
  }'
```

### Users (Admin Only)

#### Get all users
```bash
curl -X GET "http://localhost:3000/api/users?page=1&limit=20" \
  -H "Authorization: Bearer <token>"
```

#### Create user
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Doe",
    "email": "jane@example.com",
    "password": "Password123",
    "role": "ANALYST"
  }'
```

#### Get user by ID
```bash
curl -X GET http://localhost:3000/api/users/<user-id> \
  -H "Authorization: Bearer <token>"
```

#### Update user
```bash
curl -X PATCH http://localhost:3000/api/users/<user-id> \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Smith",
    "role": "ADMIN",
    "status": "ACTIVE"
  }'
```

#### Delete user
```bash
curl -X DELETE http://localhost:3000/api/users/<user-id> \
  -H "Authorization: Bearer <token>"
```

### Records

#### Get all records (All authenticated users)
```bash
curl -X GET "http://localhost:3000/api/records?page=1&limit=20&type=INCOME&category=Salary&startDate=2024-01-01&endDate=2024-12-31" \
  -H "Authorization: Bearer <token>"
```

#### Get record by ID (All authenticated users)
```bash
curl -X GET http://localhost:3000/api/records/<record-id> \
  -H "Authorization: Bearer <token>"
```

#### Create record (Admin only)
```bash
curl -X POST http://localhost:3000/api/records \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 5000.00,
    "type": "INCOME",
    "category": "Salary",
    "date": "2024-03-15",
    "notes": "Monthly salary"
  }'
```

#### Update record (Admin only)
```bash
curl -X PATCH http://localhost:3000/api/records/<record-id> \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 5500.00,
    "notes": "Updated salary"
  }'
```

#### Delete record (Admin only - soft delete)
```bash
curl -X DELETE http://localhost:3000/api/records/<record-id> \
  -H "Authorization: Bearer <token>"
```

### Dashboard (Analyst & Admin only)

#### Get summary
```bash
curl -X GET http://localhost:3000/api/dashboard/summary \
  -H "Authorization: Bearer <token>"
```

Response:
```json
{
  "success": true,
  "data": {
    "totalIncome": 50000.00,
    "totalExpenses": 20000.00,
    "netBalance": 30000.00,
    "totalRecords": 42
  }
}
```

#### Get category totals
```bash
curl -X GET http://localhost:3000/api/dashboard/categories \
  -H "Authorization: Bearer <token>"
```

#### Get monthly trends
```bash
curl -X GET "http://localhost:3000/api/dashboard/trends?months=6" \
  -H "Authorization: Bearer <token>"
```

#### Get recent activity
```bash
curl -X GET "http://localhost:3000/api/dashboard/recent?limit=10" \
  -H "Authorization: Bearer <token>"
```

## API Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... }
}
```

### Paginated Response
```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "totalPages": 5
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message"
}
```

### Validation Error Response
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

## Assumptions Made

1. **Single Database**: The application assumes a single PostgreSQL database instance.

2. **JWT Token Storage**: Tokens are stored in localStorage on the client side. For production, consider using httpOnly cookies.

3. **Soft Delete for Records**: Financial records use soft delete (deletedAt field) to preserve audit trails. Users are hard deleted.

4. **No Email Verification**: Registration doesn't require email verification. Add this for production.

5. **Simple Role Hierarchy**: Three fixed roles (VIEWER, ANALYST, ADMIN) without custom permissions.

6. **UTC Dates**: All dates are stored and processed in UTC.

7. **USD Currency**: The frontend displays amounts in USD format.

## Design Decisions

1. **Service Layer Pattern**: Business logic is encapsulated in service files, keeping route handlers thin and focused on HTTP concerns.

2. **Higher-Order Function Middleware**: `withAuth` and `withRole` are composable HOFs that wrap route handlers, providing clean separation of authentication/authorization concerns.

3. **Zod for Validation**: Runtime validation with Zod provides type-safe request parsing with detailed error messages.

4. **Prisma Decimal Handling**: Financial amounts use Prisma's Decimal type for precision, converted to numbers in API responses.

5. **Error Handling Strategy**: Centralized `errorResponse` function handles all error types (Zod, Prisma, AppError) uniformly.

6. **Pagination by Default**: All list endpoints support pagination with configurable page and limit parameters.

7. **Soft Delete for Audit Trail**: Financial records are soft-deleted to maintain data integrity and audit capabilities.

8. **Stateless Authentication**: JWT-based auth allows horizontal scaling without session storage.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run db:migrate` | Run Prisma migrations |
| `npm run db:push` | Push schema to database |
| `npm run db:seed` | Seed database with test data |

## License

MIT
