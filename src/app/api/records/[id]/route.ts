import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth, withRole } from '@/lib/middleware';
import { getRecordById, updateRecord, deleteRecord } from '@/lib/services/record.service';
import { errorResponse } from '@/lib/errors';
import { Role, RecordType, AuthUser } from '@/types';

const updateRecordSchema = z.object({
  amount: z.number().positive('Amount must be a positive number').optional(),
  type: z.enum(['INCOME', 'EXPENSE']).optional(),
  category: z.string().min(1, 'Category is required').optional(),
  date: z.string().refine((val: string) => !isNaN(Date.parse(val)), { message: 'Invalid date format' }).optional(),
  notes: z.string().nullable().optional(),
});

export const GET = withAuth(
  async (request: NextRequest, { user }: { user: AuthUser }, params?: Record<string, string>) => {
    try {
      const id = params?.id;
      
      if (!id) {
        return NextResponse.json({ success: false, error: 'Record ID is required' }, { status: 400 });
      }

      const record = await getRecordById(id);

      return NextResponse.json({ success: true, data: record });
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
        return NextResponse.json({ success: false, error: 'Record ID is required' }, { status: 400 });
      }

      const body = await request.json();
      const validatedData = updateRecordSchema.parse(body);

      const record = await updateRecord(id, {
        amount: validatedData.amount,
        type: validatedData.type as RecordType | undefined,
        category: validatedData.category,
        date: validatedData.date,
        notes: validatedData.notes === null ? undefined : validatedData.notes,
      });

      return NextResponse.json({ success: true, data: record });
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
        return NextResponse.json({ success: false, error: 'Record ID is required' }, { status: 400 });
      }

      await deleteRecord(id);

      return NextResponse.json({ success: true, message: 'Record deleted successfully' });
    } catch (error) {
      return errorResponse(error);
    }
  }
);
