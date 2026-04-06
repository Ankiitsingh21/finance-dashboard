import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth, withRole } from '@/lib/middleware';
import { getRecords, createRecord } from '@/lib/services/record.service';
import { errorResponse } from '@/lib/errors';
import { Role, RecordType, AuthUser } from '@/types';

const createRecordSchema = z.object({
  amount: z.number().positive('Amount must be a positive number'),
  type: z.enum(['INCOME', 'EXPENSE']),
  category: z.string().min(1, 'Category is required'),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid date format' }),
  notes: z.string().optional(),
});

export const GET = withAuth(
  async (request: NextRequest, { user }: { user: AuthUser }) => {
    try {
      const { searchParams } = new URL(request.url);
      
      const filters = {
        type: searchParams.get('type') as RecordType | undefined,
        category: searchParams.get('category') || undefined,
        startDate: searchParams.get('startDate') || undefined,
        endDate: searchParams.get('endDate') || undefined,
        page: parseInt(searchParams.get('page') || '1', 10),
        limit: parseInt(searchParams.get('limit') || '20', 10),
      };

      if (filters.type && !['INCOME', 'EXPENSE'].includes(filters.type)) {
        filters.type = undefined;
      }

      const result = await getRecords(filters);

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

export const POST = withRole(Role.ADMIN)(
  async (request: NextRequest, { user }: { user: AuthUser }) => {
    try {
      const body = await request.json();
      const validatedData = createRecordSchema.parse(body);

      const record = await createRecord(
        {
          amount: validatedData.amount,
          type: validatedData.type as RecordType,
          category: validatedData.category,
          date: validatedData.date,
          notes: validatedData.notes,
        },
        user.id
      );

      return NextResponse.json({ success: true, data: record }, { status: 201 });
    } catch (error) {
      return errorResponse(error);
    }
  }
);
