import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/lib/middleware';
import { getSummary } from '@/lib/services/dashboard.service';
import { errorResponse } from '@/lib/errors';
import { Role, AuthUser } from '@/types';

// GET /api/dashboard/summary - Get dashboard summary (ANALYST, ADMIN only)
export const GET = withRole(Role.ANALYST, Role.ADMIN)(
  async (request: NextRequest, { user }: { user: AuthUser }) => {
    try {
      const summary = await getSummary();

      return NextResponse.json({
        success: true,
        data: summary,
      });
    } catch (error) {
      return errorResponse(error);
    }
  }
);
