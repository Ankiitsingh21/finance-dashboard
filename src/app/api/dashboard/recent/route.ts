import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/lib/middleware';
import { getRecentActivity } from '@/lib/services/dashboard.service';
import { errorResponse } from '@/lib/errors';
import { Role, AuthUser } from '@/types';

export const GET = withRole(Role.ANALYST, Role.ADMIN)(
  async (request: NextRequest, { user }: { user: AuthUser }) => {
    try {
      const { searchParams } = new URL(request.url);
      let limit = parseInt(searchParams.get('limit') || '10', 10);

      if (isNaN(limit) || limit < 1) limit = 10;
      if (limit > 50) limit = 50;

      const recent = await getRecentActivity(limit);

      return NextResponse.json({ success: true, data: recent });
    } catch (error) {
      return errorResponse(error);
    }
  }
);
