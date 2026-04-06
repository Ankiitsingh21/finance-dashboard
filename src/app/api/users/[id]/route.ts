import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withRole } from '@/lib/middleware';
import { getUserById, updateUser, deleteUser } from '@/lib/services/user.service';
import { errorResponse } from '@/lib/errors';
import { Role, UserStatus, AuthUser } from '@/types';

const updateUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  role: z.enum(['VIEWER', 'ANALYST', 'ADMIN']).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});

export const GET = withRole(Role.ADMIN)(
  async (request: NextRequest, { user }: { user: AuthUser }, params?: Record<string, string>) => {
    try {
      const id = params?.id;
      
      if (!id) {
        return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 });
      }

      const foundUser = await getUserById(id);

      return NextResponse.json({ success: true, data: foundUser });
    } catch (error) {
      return errorResponse(error);
    }
  }
);

export const PATCH = withRole(Role.ADMIN)(
  async (request: NextRequest, { user }: { user: AuthUser }, params?: Record<string, string>) => {
    try {
      const id = params?.id;
      
      if (!id) {
        return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 });
      }

      const body = await request.json();
      const validatedData = updateUserSchema.parse(body);

      const updatedUser = await updateUser(id, {
        name: validatedData.name,
        role: validatedData.role as Role | undefined,
        status: validatedData.status as UserStatus | undefined,
      });

      return NextResponse.json({ success: true, data: updatedUser });
    } catch (error) {
      return errorResponse(error);
    }
  }
);

export const DELETE = withRole(Role.ADMIN)(
  async (request: NextRequest, { user }: { user: AuthUser }, params?: Record<string, string>) => {
    try {
      const id = params?.id;
      
      if (!id) {
        return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 });
      }

      await deleteUser(id);

      return NextResponse.json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
      return errorResponse(error);
    }
  }
);
