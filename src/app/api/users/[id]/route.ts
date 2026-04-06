import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withRole } from '@/lib/middleware';
import { getUserById, updateUser, deleteUser } from '@/lib/services/user.service';
import { errorResponse } from '@/lib/errors';
import { Role, UserStatus, AuthUser } from '@/types';

// Validation schema for updating a user
const updateUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  role: z.enum(['VIEWER', 'ANALYST', 'ADMIN']).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});

// GET /api/users/[id] - Get a single user (ADMIN only)
export const GET = withRole(Role.ADMIN)(
  async (request: NextRequest, { user }: { user: AuthUser }, params?: Record<string, string>) => {
    try {
      const id = params?.id;
      
      if (!id) {
        return NextResponse.json(
          { success: false, error: 'User ID is required' },
          { status: 400 }
        );
      }

      const foundUser = await getUserById(id);

      return NextResponse.json({
        success: true,
        data: foundUser,
      });
    } catch (error) {
      return errorResponse(error);
    }
  }
);

// PATCH /api/users/[id] - Update a user (ADMIN only)
export const PATCH = withRole(Role.ADMIN)(
  async (request: NextRequest, { user }: { user: AuthUser }, params?: Record<string, string>) => {
    try {
      const id = params?.id;
      
      if (!id) {
        return NextResponse.json(
          { success: false, error: 'User ID is required' },
          { status: 400 }
        );
      }

      const body = await request.json();

      // Validate input
      const validatedData = updateUserSchema.parse(body);

      // Update user
      const updatedUser = await updateUser(id, {
        name: validatedData.name,
        role: validatedData.role as Role | undefined,
        status: validatedData.status as UserStatus | undefined,
      });

      return NextResponse.json({
        success: true,
        data: updatedUser,
      });
    } catch (error) {
      return errorResponse(error);
    }
  }
);

// DELETE /api/users/[id] - Delete a user (ADMIN only)
export const DELETE = withRole(Role.ADMIN)(
  async (request: NextRequest, { user }: { user: AuthUser }, params?: Record<string, string>) => {
    try {
      const id = params?.id;
      
      if (!id) {
        return NextResponse.json(
          { success: false, error: 'User ID is required' },
          { status: 400 }
        );
      }

      await deleteUser(id);

      return NextResponse.json({
        success: true,
        message: 'User deleted successfully',
      });
    } catch (error) {
      return errorResponse(error);
    }
  }
);
