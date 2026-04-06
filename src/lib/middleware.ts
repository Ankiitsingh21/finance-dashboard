import { NextRequest, NextResponse } from 'next/server';
import { AuthUser, Role } from '@/types';
import { extractToken, verifyToken } from './auth';
import { AppError, errorResponse } from './errors';
import prisma from './prisma';

export interface AuthContext {
  user: AuthUser;
}

export type AuthenticatedHandler = (
  request: NextRequest,
  context: AuthContext,
  params?: Record<string, string>
) => Promise<NextResponse>;

export function withAuth(handler: AuthenticatedHandler) {
  return async (
    request: NextRequest,
    { params }: { params?: Promise<Record<string, string>> }
  ): Promise<NextResponse> => {
    try {
      const token = extractToken(request);
      const user = verifyToken(token);

      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { id: true, status: true },
      });

      if (!dbUser) {
        throw new AppError(401, 'User not found');
      }

      if (dbUser.status === 'INACTIVE') {
        throw new AppError(403, 'Account inactive');
      }

      const resolvedParams = params ? await params : undefined;

      return handler(request, { user }, resolvedParams);
    } catch (error) {
      return errorResponse(error);
    }
  };
}

export function withRole(...roles: Role[]) {
  return (handler: AuthenticatedHandler) => {
    return withAuth(async (request: NextRequest, context: AuthContext, params?: Record<string, string>) => {
      if (!roles.includes(context.user.role as Role)) {
        throw new AppError(403, 'Insufficient permissions');
      }

      return handler(request, context, params);
    });
  };
}
