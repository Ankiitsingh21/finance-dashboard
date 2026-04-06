import { NextRequest, NextResponse } from 'next/server';
import { AuthUser, Role } from '@/types';
import { extractToken, verifyToken } from './auth';
import { AppError, errorResponse } from './errors';
import prisma from './prisma';

// Context passed to authenticated handlers
export interface AuthContext {
  user: AuthUser;
}

// Route handler type with authentication context
export type AuthenticatedHandler = (
  request: NextRequest,
  context: AuthContext,
  params?: Record<string, string>
) => Promise<NextResponse>;

/**
 * Higher-order function that wraps a route handler with authentication
 * Verifies JWT token and checks if user is active
 */
export function withAuth(handler: AuthenticatedHandler) {
  return async (
    request: NextRequest,
    { params }: { params?: Promise<Record<string, string>> }
  ): Promise<NextResponse> => {
    try {
      // Extract and verify token
      const token = extractToken(request);
      const user = verifyToken(token);

      // Check if user exists and is active
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

      // Resolve params if they exist
      const resolvedParams = params ? await params : undefined;

      // Call the handler with authenticated context
      return handler(request, { user }, resolvedParams);
    } catch (error) {
      return errorResponse(error);
    }
  };
}

/**
 * Higher-order function that wraps a route handler with role-based authorization
 * Must be used after or instead of withAuth
 * @param roles - Allowed roles for this route
 */
export function withRole(...roles: Role[]) {
  return (handler: AuthenticatedHandler) => {
    return withAuth(async (request: NextRequest, context: AuthContext, params?: Record<string, string>) => {
      // Check if user has required role
      if (!roles.includes(context.user.role as Role)) {
        throw new AppError(403, 'Insufficient permissions');
      }

      return handler(request, context, params);
    });
  };
}
