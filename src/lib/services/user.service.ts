import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { AppError } from '@/lib/errors';
import { SafeUser, CreateUserInput, UpdateUserInput, PaginatedResponse, Role, UserStatus } from '@/types';
import { User } from '@/generated/prisma/client';

const SALT_ROUNDS = 10;

const safeUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  status: true,
  createdAt: true,
  updatedAt: true,
};

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

export async function getAllUsers(page: number = 1, limit: number = 20): Promise<PaginatedResponse<SafeUser>> {
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

export async function getUserByEmail(email: string): Promise<User | null> {
  return prisma.user.findUnique({ where: { email } });
}

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

export async function updateUser(id: string, data: UpdateUserInput): Promise<SafeUser> {
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

export async function deleteUser(id: string): Promise<void> {
  const existingUser = await prisma.user.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!existingUser) {
    throw new AppError(404, 'User not found');
  }

  await prisma.financialRecord.deleteMany({ where: { userId: id } });
  await prisma.user.delete({ where: { id } });
}

export async function verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(plainPassword, hashedPassword);
}
