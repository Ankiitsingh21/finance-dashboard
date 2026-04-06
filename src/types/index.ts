export enum Role {
  VIEWER = 'VIEWER',
  ANALYST = 'ANALYST',
  ADMIN = 'ADMIN',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export enum RecordType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
}

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  errors?: Record<string, string[]>;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
}

export interface RecordFilterQuery extends PaginationQuery {
  type?: RecordType;
  category?: string;
  startDate?: string;
  endDate?: string;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

export interface SafeUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
}

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

export interface DashboardSummary {
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
  totalRecords: number;
}

export interface CategoryTotal {
  category: string;
  income: number;
  expenses: number;
  net: number;
}

export interface MonthlyTrend {
  month: string;
  income: number;
  expenses: number;
}

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  role?: Role;
}

export interface UpdateUserInput {
  name?: string;
  role?: Role;
  status?: UserStatus;
}

export interface CreateRecordInput {
  amount: number;
  type: RecordType;
  category: string;
  date: string;
  notes?: string;
}

export interface UpdateRecordInput {
  amount?: number;
  type?: RecordType;
  category?: string;
  date?: string;
  notes?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: SafeUser;
  token: string;
}
