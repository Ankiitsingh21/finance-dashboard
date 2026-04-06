import { PrismaClient, Role, RecordType } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcryptjs';

const adapter = new PrismaPg({ 
  connectionString: process.env.DATABASE_URL || "postgresql://neondb_owner:npg_3XoUWDCOhHw8@ep-delicate-band-an1wj4if-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding database...');

  await prisma.financialRecord.deleteMany();
  await prisma.user.deleteMany();

  const hashedPassword = await bcrypt.hash('Password123', 10);

  const adminUser = await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@example.com',
      password: hashedPassword,
      role: Role.ADMIN,
    },
  });

  await prisma.user.create({
    data: {
      name: 'Analyst User',
      email: 'analyst@example.com',
      password: hashedPassword,
      role: Role.ANALYST,
    },
  });

  await prisma.user.create({
    data: {
      name: 'Viewer User',
      email: 'viewer@example.com',
      password: hashedPassword,
      role: Role.VIEWER,
    },
  });

  const records = [];

  for (let monthOffset = 0; monthOffset < 6; monthOffset++) {
    const date = new Date();
    date.setMonth(date.getMonth() - monthOffset);

    records.push({
      amount: 5000 + Math.random() * 3000,
      type: RecordType.INCOME,
      category: 'Salary',
      date: new Date(date.getFullYear(), date.getMonth(), 1),
      notes: `Monthly salary for ${date.toLocaleString('default', { month: 'long' })}`,
      userId: adminUser.id,
    });

    records.push({
      amount: 1000 + Math.random() * 2000,
      type: RecordType.INCOME,
      category: 'Sales',
      date: new Date(date.getFullYear(), date.getMonth(), 15),
      notes: 'Product sales revenue',
      userId: adminUser.id,
    });

    records.push({
      amount: 500 + Math.random() * 500,
      type: RecordType.INCOME,
      category: 'Consulting',
      date: new Date(date.getFullYear(), date.getMonth(), 20),
      notes: 'Consulting fees',
      userId: adminUser.id,
    });

    records.push({
      amount: 1500 + Math.random() * 500,
      type: RecordType.EXPENSE,
      category: 'Rent',
      date: new Date(date.getFullYear(), date.getMonth(), 1),
      notes: 'Office rent',
      userId: adminUser.id,
    });

    records.push({
      amount: 200 + Math.random() * 100,
      type: RecordType.EXPENSE,
      category: 'Utilities',
      date: new Date(date.getFullYear(), date.getMonth(), 5),
      notes: 'Electricity and water bills',
      userId: adminUser.id,
    });

    records.push({
      amount: 300 + Math.random() * 400,
      type: RecordType.EXPENSE,
      category: 'Marketing',
      date: new Date(date.getFullYear(), date.getMonth(), 10),
      notes: 'Marketing campaigns',
      userId: adminUser.id,
    });

    records.push({
      amount: 100 + Math.random() * 200,
      type: RecordType.EXPENSE,
      category: 'Equipment',
      date: new Date(date.getFullYear(), date.getMonth(), 25),
      notes: 'Office supplies and equipment',
      userId: adminUser.id,
    });
  }

  for (const record of records) {
    await prisma.financialRecord.create({ data: record });
  }

  console.log(`Created 3 users and ${records.length} records`);
  console.log('Done!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
