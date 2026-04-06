import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withRole } from '@/lib/middleware';
import { getAllUsers, createUser } from '@/lib/services/user.service';
import { errorResponse } from '@/lib/errors';
import { Role, AuthUser } from '@/types';

// Validation schema for creating a user
const createUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['VIEWER', 'ANALYST', 'ADMIN']).optional(),
});

// GET /api/users - Get all users (ADMIN only)
export const GET = withRole(Role.ADMIN)(
  async (request: NextRequest, { user }: { user: AuthUser }) => {
    try {
      const { searchParams } = new URL(request.url);
      const page = parseInt(searchParams.get('page') || '1', 10);
      const limit = parseInt(searchParams.get('limit') || '20', 10);

      const result = await getAllUsers(page, limit);

      return NextResponse.json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      return errorResponse(error);
    }
  }
);

// POST /api/users - Create a new user (ADMIN only)
export const POST = withRole(Role.ADMIN)(
  async (request: NextRequest, { user }: { user: AuthUser }) => {
    try {
      const body = await request.json();

      // Validate input
      const validatedData = createUserSchema.parse(body);

      // Create user
      const newUser = await createUser({
        name: validatedData.name,
        email: validatedData.email,
        password: validatedData.password,
        role: validatedData.role as Role | undefined,
      });

      return NextResponse.json(
        {
          success: true,
          data: newUser,
        },
        { status: 201 }
      );
    } catch (error) {
      return errorResponse(error);
    }
  }
);
