import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getUserByEmail, verifyPassword } from '@/lib/services/user.service';
import { signToken } from '@/lib/auth';
import { AppError, errorResponse } from '@/lib/errors';
import { Role, UserStatus } from '@/types';

// Validation schema for login
const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validatedData = loginSchema.parse(body);
    
    // Find user by email
    const user = await getUserByEmail(validatedData.email.toLowerCase());
    
    if (!user) {
      throw new AppError(401, 'Invalid email or password');
    }
    
    // Check if user is active
    if (user.status === 'INACTIVE') {
      throw new AppError(403, 'Account is inactive');
    }
    
    // Verify password
    const isValidPassword = await verifyPassword(validatedData.password, user.password);
    
    if (!isValidPassword) {
      throw new AppError(401, 'Invalid email or password');
    }
    
    // Generate token
    const token = signToken({
      id: user.id,
      email: user.email,
      role: user.role as Role,
    });
    
    // Return user without password
    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role as Role,
      status: user.status as UserStatus,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
    
    return NextResponse.json({
      success: true,
      data: {
        user: safeUser,
        token,
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
