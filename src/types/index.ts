// Role enum matching Prisma schema
export enum Role {
  VIEWER = 'VIEWER',
  ANALYST = 'ANALYST',
  ADMIN = 'ADMIN',
}

// UserStatus enum matching Prisma schema
export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

// RecordType enum matching Prisma schema
export enum RecordType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
}

// Authenticated user payload from JWT
export interface AuthUser {
  id: string;
  email: string;
  role: Role;
}

// Generic API response type
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  errors?: Record<string, string[]>;
}

// Pagination query parameters
export interface PaginationQuery {
  page?: number;
  limit?: number;
}

// Record filter query parameters
export interface RecordFilterQuery extends PaginationQuery {
  type?: RecordType;
  category?: string;
  startDate?: string;
  endDate?: string;
}

// Pagination response metadata
export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Paginated response
export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

// User type without password
export interface SafeUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
}

// Financial record type with serialized amount
export interface FinancialRecordResponse {
  id: string;
  amount: number;
  type: RecordType;
  category: string;
  date: Date;
  notes: string | null;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: {
    id: string;
    name: string;
    email: string;
  };
}

// Dashboard summary type
export interface DashboardSummary {
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
  totalRecords: number;
}

// Category totals type
export interface CategoryTotal {
  category: string;
  income: number;
  expenses: number;
  net: number;
}

// Monthly trend type
export interface MonthlyTrend {
  month: string;
  income: number;
  expenses: number;
}

// Create user input
export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  role?: Role;
}

// Update user input
export interface UpdateUserInput {
  name?: string;
  role?: Role;
  status?: UserStatus;
}

// Create record input
export interface CreateRecordInput {
  amount: number;
  type: RecordType;
  category: string;
  date: string;
  notes?: string;
}

// Update record input
export interface UpdateRecordInput {
  amount?: number;
  type?: RecordType;
  category?: string;
  date?: string;
  notes?: string;
}

// Login credentials
export interface LoginCredentials {
  email: string;
  password: string;
}

// Auth response
export interface AuthResponse {
  user: SafeUser;
  token: string;
}
