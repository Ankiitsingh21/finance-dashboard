import prisma from '@/lib/prisma';
import {
  DashboardSummary,
  CategoryTotal,
  MonthlyTrend,
  FinancialRecordResponse,
  RecordType,
} from '@/types';

// Helper to safely convert Prisma Decimal to number
function toNumber(value: unknown): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'object' && value !== null && 'toNumber' in value) {
    return (value as { toNumber(): number }).toNumber();
  }
  return Number(value);
}

/**
 * Get dashboard summary statistics
 */
export async function getSummary(): Promise<DashboardSummary> {
  // Get total income
  const incomeResult = await prisma.financialRecord.aggregate({
    where: {
      type: 'INCOME',
      deletedAt: null,
    },
    _sum: {
      amount: true,
    },
  });

  // Get total expenses
  const expenseResult = await prisma.financialRecord.aggregate({
    where: {
      type: 'EXPENSE',
      deletedAt: null,
    },
    _sum: {
      amount: true,
    },
  });

  // Get total record count
  const totalRecords = await prisma.financialRecord.count({
    where: {
      deletedAt: null,
    },
  });

  const totalIncome = toNumber(incomeResult._sum.amount);
  const totalExpenses = toNumber(expenseResult._sum.amount);

  return {
    totalIncome,
    totalExpenses,
    netBalance: totalIncome - totalExpenses,
    totalRecords,
  };
}

/**
 * Get category totals for income and expenses
 */
export async function getCategoryTotals(): Promise<CategoryTotal[]> {
  // Get all records grouped by category and type
  const records = await prisma.financialRecord.groupBy({
    by: ['category', 'type'],
    where: {
      deletedAt: null,
    },
    _sum: {
      amount: true,
    },
    orderBy: {
      category: 'asc',
    },
  });

  // Transform into category totals
  const categoryMap = new Map<string, { income: number; expenses: number }>();

  records.forEach((record) => {
    const category = record.category;
    const amount = toNumber(record._sum.amount);

    if (!categoryMap.has(category)) {
      categoryMap.set(category, { income: 0, expenses: 0 });
    }

    const entry = categoryMap.get(category)!;
    if (record.type === 'INCOME') {
      entry.income = amount;
    } else {
      entry.expenses = amount;
    }
  });

  // Convert map to array
  const result: CategoryTotal[] = [];
  categoryMap.forEach((value, category) => {
    result.push({
      category,
      income: value.income,
      expenses: value.expenses,
      net: value.income - value.expenses,
    });
  });

  // Sort by net value descending
  result.sort((a, b) => b.net - a.net);

  return result;
}

/**
 * Get monthly trends for the last N months
 */
export async function getMonthlyTrends(months: number = 6): Promise<MonthlyTrend[]> {
  // Calculate start date
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months + 1);
  startDate.setDate(1);
  startDate.setHours(0, 0, 0, 0);

  // Get all records from the period
  const records = await prisma.financialRecord.findMany({
    where: {
      deletedAt: null,
      date: {
        gte: startDate,
      },
    },
    select: {
      amount: true,
      type: true,
      date: true,
    },
    orderBy: {
      date: 'asc',
    },
  });

  // Group by month
  const monthlyMap = new Map<string, { income: number; expenses: number }>();

  // Initialize all months with zero values
  for (let i = 0; i < months; i++) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    monthlyMap.set(monthKey, { income: 0, expenses: 0 });
  }

  // Aggregate records by month
  records.forEach((record) => {
    const date = new Date(record.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    const amount = toNumber(record.amount);

    if (monthlyMap.has(monthKey)) {
      const entry = monthlyMap.get(monthKey)!;
      if (record.type === 'INCOME') {
        entry.income += amount;
      } else {
        entry.expenses += amount;
      }
    }
  });

  // Convert to array and sort by date
  const result: MonthlyTrend[] = [];
  monthlyMap.forEach((value, month) => {
    result.push({
      month,
      income: Math.round(value.income * 100) / 100,
      expenses: Math.round(value.expenses * 100) / 100,
    });
  });

  // Sort chronologically
  result.sort((a, b) => a.month.localeCompare(b.month));

  return result;
}

/**
 * Get recent activity (most recent records)
 */
export async function getRecentActivity(
  limit: number = 10
): Promise<FinancialRecordResponse[]> {
  const records = await prisma.financialRecord.findMany({
    where: {
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
    orderBy: {
      createdAt: 'desc',
    },
    take: limit,
  });

  return records.map((record) => ({
    id: record.id,
    amount: toNumber(record.amount),
    type: record.type as RecordType,
    category: record.category,
    date: record.date,
    notes: record.notes,
    userId: record.userId,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    createdBy: {
      id: record.createdBy.id,
      name: record.createdBy.name,
      email: record.createdBy.email,
    },
  }));
}
