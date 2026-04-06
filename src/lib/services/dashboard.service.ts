import prisma from '@/lib/prisma';
import { DashboardSummary, CategoryTotal, MonthlyTrend, FinancialRecordResponse, RecordType } from '@/types';

function toNumber(value: unknown): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'object' && value !== null && 'toNumber' in value) {
    return (value as { toNumber(): number }).toNumber();
  }
  return Number(value);
}

export async function getSummary(): Promise<DashboardSummary> {
  const incomeResult = await prisma.financialRecord.aggregate({
    where: { type: 'INCOME', deletedAt: null },
    _sum: { amount: true },
  });

  const expenseResult = await prisma.financialRecord.aggregate({
    where: { type: 'EXPENSE', deletedAt: null },
    _sum: { amount: true },
  });

  const totalRecords = await prisma.financialRecord.count({
    where: { deletedAt: null },
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

export async function getCategoryTotals(): Promise<CategoryTotal[]> {
  const records = await prisma.financialRecord.groupBy({
    by: ['category', 'type'],
    where: { deletedAt: null },
    _sum: { amount: true },
    orderBy: { category: 'asc' },
  });

  const categoryMap = new Map<string, { income: number; expenses: number }>();

  records.forEach((record) => {
    const amount = toNumber(record._sum.amount);

    if (!categoryMap.has(record.category)) {
      categoryMap.set(record.category, { income: 0, expenses: 0 });
    }

    const entry = categoryMap.get(record.category)!;
    if (record.type === 'INCOME') {
      entry.income = amount;
    } else {
      entry.expenses = amount;
    }
  });

  const result: CategoryTotal[] = [];
  categoryMap.forEach((value, category) => {
    result.push({
      category,
      income: value.income,
      expenses: value.expenses,
      net: value.income - value.expenses,
    });
  });

  result.sort((a, b) => b.net - a.net);

  return result;
}

export async function getMonthlyTrends(months: number = 6): Promise<MonthlyTrend[]> {
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months + 1);
  startDate.setDate(1);
  startDate.setHours(0, 0, 0, 0);

  const records = await prisma.financialRecord.findMany({
    where: { deletedAt: null, date: { gte: startDate } },
    select: { amount: true, type: true, date: true },
    orderBy: { date: 'asc' },
  });

  const monthlyMap = new Map<string, { income: number; expenses: number }>();

  for (let i = 0; i < months; i++) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    monthlyMap.set(monthKey, { income: 0, expenses: 0 });
  }

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

  const result: MonthlyTrend[] = [];
  monthlyMap.forEach((value, month) => {
    result.push({
      month,
      income: Math.round(value.income * 100) / 100,
      expenses: Math.round(value.expenses * 100) / 100,
    });
  });

  result.sort((a, b) => a.month.localeCompare(b.month));

  return result;
}

export async function getRecentActivity(limit: number = 10): Promise<FinancialRecordResponse[]> {
  const records = await prisma.financialRecord.findMany({
    where: { deletedAt: null },
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
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
