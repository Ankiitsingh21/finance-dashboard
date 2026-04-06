import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { AppError } from '@/lib/errors';
import {
  SafeUser,
  CreateUserInput,
  UpdateUserInput,
  PaginatedResponse,
  Role,
  UserStatus,
} from '@/types';
import { User } from '@prisma/client';

const SALT_ROUNDS = 10;

// Fields to select when returning user data (excludes password)
const safeUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  status: true,
  createdAt: true,
  updatedAt: true,
};

/**
 * Converts a Prisma User to SafeUser (without password)
 */
function toSafeUser(user: Omit<User, 'password'>): SafeUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role as Role,
    status: user.status as UserStatus,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

/**
 * Get all users with pagination
 */
export async function getAllUsers(
  page: number = 1,
  limit: number = 20
): Promise<PaginatedResponse<SafeUser>> {
  const skip = (page - 1) * limit;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      select: safeUserSelect,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.count(),
  ]);

  return {
    data: users.map(toSafeUser),
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Get a single user by ID
 */
export async function getUserById(id: string): Promise<SafeUser> {
  const user = await prisma.user.findUnique({
    where: { id },
    select: safeUserSelect,
  });

  if (!user) {
    throw new AppError(404, 'User not found');
  }

  return toSafeUser(user);
}

/**
 * Get a user by email (includes password for authentication)
 */
export async function getUserByEmail(email: string): Promise<User | null> {
  return prisma.user.findUnique({
    where: { email },
  });
}

/**
 * Create a new user with hashed password
 */
export async function createUser(data: CreateUserInput): Promise<SafeUser> {
  const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email.toLowerCase(),
      password: hashedPassword,
      role: data.role || 'VIEWER',
    },
    select: safeUserSelect,
  });

  return toSafeUser(user);
}

/**
 * Update a user's profile
 */
export async function updateUser(
  id: string,
  data: UpdateUserInput
): Promise<SafeUser> {
  // Verify user exists
  const existingUser = await prisma.user.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!existingUser) {
    throw new AppError(404, 'User not found');
  }

  const user = await prisma.user.update({
    where: { id },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.role && { role: data.role }),
      ...(data.status && { status: data.status }),
    },
    select: safeUserSelect,
  });

  return toSafeUser(user);
}

/**
 * Delete a user (hard delete)
 */
export async function deleteUser(id: string): Promise<void> {
  // Verify user exists
  const existingUser = await prisma.user.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!existingUser) {
    throw new AppError(404, 'User not found');
  }

  // Delete associated records first (cascade)
  await prisma.financialRecord.deleteMany({
    where: { userId: id },
  });

  await prisma.user.delete({
    where: { id },
  });
}

/**
 * Verify user password
 */
export async function verifyPassword(
  plainPassword: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(plainPassword, hashedPassword);
}
