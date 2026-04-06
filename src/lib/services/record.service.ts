import prisma from '@/lib/prisma';
import { AppError } from '@/lib/errors';
import {
  FinancialRecordResponse,
  RecordFilterQuery,
  CreateRecordInput,
  UpdateRecordInput,
  PaginatedResponse,
  RecordType,
} from '@/types';
import { FinancialRecord, User } from '@prisma/client';

type RecordWithCreator = FinancialRecord & {
  createdBy: Pick<User, 'id' | 'name' | 'email'>;
};

/**
 * Converts a Prisma FinancialRecord to response format
 * Handles Decimal to number conversion
 */
function toRecordResponse(
  record: FinancialRecord | RecordWithCreator
): FinancialRecordResponse {
  const response: FinancialRecordResponse = {
    id: record.id,
    amount: typeof record.amount === 'object' && 'toNumber' in record.amount
      ? (record.amount as { toNumber(): number }).toNumber()
      : Number(record.amount),
    type: record.type as RecordType,
    category: record.category,
    date: record.date,
    notes: record.notes,
    userId: record.userId,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };

  if ('createdBy' in record && record.createdBy) {
    response.createdBy = {
      id: record.createdBy.id,
      name: record.createdBy.name,
      email: record.createdBy.email,
    };
  }

  return response;
}

/**
 * Get all financial records with filtering and pagination
 */
export async function getRecords(
  filters: RecordFilterQuery
): Promise<PaginatedResponse<FinancialRecordResponse>> {
  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const skip = (page - 1) * limit;

  // Build where clause
  const where: {
    deletedAt: null;
    type?: RecordType;
    category?: { contains: string; mode: 'insensitive' };
    date?: { gte?: Date; lte?: Date };
  } = {
    deletedAt: null, // Only non-deleted records
  };

  if (filters.type) {
    where.type = filters.type;
  }

  if (filters.category) {
    where.category = {
      contains: filters.category,
      mode: 'insensitive',
    };
  }

  if (filters.startDate || filters.endDate) {
    where.date = {};
    if (filters.startDate) {
      where.date.gte = new Date(filters.startDate);
    }
    if (filters.endDate) {
      where.date.lte = new Date(filters.endDate);
    }
  }

  const [records, total] = await Promise.all([
    prisma.financialRecord.findMany({
      where,
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      skip,
      take: limit,
      orderBy: { date: 'desc' },
    }),
    prisma.financialRecord.count({ where }),
  ]);

  return {
    data: records.map(toRecordResponse),
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Get a single financial record by ID
 */
export async function getRecordById(id: string): Promise<FinancialRecordResponse> {
  const record = await prisma.financialRecord.findFirst({
    where: {
      id,
      deletedAt: null,
    },
    include: {
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  if (!record) {
    throw new AppError(404, 'Record not found');
  }

  return toRecordResponse(record);
}

/**
 * Create a new financial record
 */
export async function createRecord(
  data: CreateRecordInput,
  userId: string
): Promise<FinancialRecordResponse> {
  const record = await prisma.financialRecord.create({
    data: {
      amount: data.amount,
      type: data.type,
      category: data.category,
      date: new Date(data.date),
      notes: data.notes || null,
      userId,
    },
    include: {
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  return toRecordResponse(record);
}

/**
 * Update a financial record
 */
export async function updateRecord(
  id: string,
  data: UpdateRecordInput
): Promise<FinancialRecordResponse> {
  // Verify record exists and is not deleted
  const existingRecord = await prisma.financialRecord.findFirst({
    where: {
      id,
      deletedAt: null,
    },
    select: { id: true },
  });

  if (!existingRecord) {
    throw new AppError(404, 'Record not found');
  }

  const record = await prisma.financialRecord.update({
    where: { id },
    data: {
      ...(data.amount !== undefined && { amount: data.amount }),
      ...(data.type && { type: data.type }),
      ...(data.category && { category: data.category }),
      ...(data.date && { date: new Date(data.date) }),
      ...(data.notes !== undefined && { notes: data.notes }),
    },
    include: {
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  return toRecordResponse(record);
}

/**
 * Soft delete a financial record
 */
export async function deleteRecord(id: string): Promise<void> {
  // Verify record exists and is not already deleted
  const existingRecord = await prisma.financialRecord.findFirst({
    where: {
      id,
      deletedAt: null,
    },
    select: { id: true },
  });

  if (!existingRecord) {
    throw new AppError(404, 'Record not found');
  }

  await prisma.financialRecord.update({
    where: { id },
    data: {
      deletedAt: new Date(),
    },
  });
}
