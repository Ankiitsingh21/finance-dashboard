import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createUser } from '@/lib/services/user.service';
import { signToken } from '@/lib/auth';
import { errorResponse } from '@/lib/errors';
import { Role } from '@/types';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['VIEWER', 'ANALYST', 'ADMIN']).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = registerSchema.parse(body);
    
    const user = await createUser({
      name: validatedData.name,
      email: validatedData.email,
      password: validatedData.password,
      role: validatedData.role as Role | undefined,
    });
    
    const token = signToken({ id: user.id, email: user.email, role: user.role });
    
    return NextResponse.json({ success: true, data: { user, token } }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
