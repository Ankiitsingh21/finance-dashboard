import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/lib/middleware';
import { getCategoryTotals } from '@/lib/services/dashboard.service';
import { errorResponse } from '@/lib/errors';
import { Role, AuthUser } from '@/types';

export const GET = withRole(Role.ANALYST, Role.ADMIN)(
  async (request: NextRequest, { user }: { user: AuthUser }) => {
    try {
      const categories = await getCategoryTotals();
      return NextResponse.json({ success: true, data: categories });
    } catch (error) {
      return errorResponse(error);
    }
  }
);
