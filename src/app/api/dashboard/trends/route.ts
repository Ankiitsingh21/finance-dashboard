import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/lib/middleware';
import { getMonthlyTrends } from '@/lib/services/dashboard.service';
import { errorResponse } from '@/lib/errors';
import { Role, AuthUser } from '@/types';

// GET /api/dashboard/trends - Get monthly trends (ANALYST, ADMIN only)
export const GET = withRole(Role.ANALYST, Role.ADMIN)(
  async (request: NextRequest, { user }: { user: AuthUser }) => {
    try {
      const { searchParams } = new URL(request.url);
      let months = parseInt(searchParams.get('months') || '6', 10);

      // Validate months parameter
      if (isNaN(months) || months < 1) {
        months = 6;
      } else if (months > 24) {
        months = 24;
      }

      const trends = await getMonthlyTrends(months);

      return NextResponse.json({
        success: true,
        data: trends,
      });
    } catch (error) {
      return errorResponse(error);
    }
  }
);
