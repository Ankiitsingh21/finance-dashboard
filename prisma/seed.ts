import { PrismaClient, Role, RecordType } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // Clear existing data
  await prisma.financialRecord.deleteMany();
  await prisma.user.deleteMany();

  const hashedPassword = await bcrypt.hash('Password123', 10);

  // Create users for each role
  const adminUser = await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@example.com',
      password: hashedPassword,
      role: Role.ADMIN,
    },
  });

  const analystUser = await prisma.user.create({
    data: {
      name: 'Analyst User',
      email: 'analyst@example.com',
      password: hashedPassword,
      role: Role.ANALYST,
    },
  });

  const viewerUser = await prisma.user.create({
    data: {
      name: 'Viewer User',
      email: 'viewer@example.com',
      password: hashedPassword,
      role: Role.VIEWER,
    },
  });

  console.log('Created users:', { adminUser, analystUser, viewerUser });

  // Create sample financial records
  const categories = ['Salary', 'Sales', 'Investment', 'Rent', 'Utilities', 'Marketing', 'Equipment', 'Consulting'];
  const records = [];

  // Generate records for the past 6 months
  for (let monthOffset = 0; monthOffset < 6; monthOffset++) {
    const date = new Date();
    date.setMonth(date.getMonth() - monthOffset);

    // Income records
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

    // Expense records
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

  // Create all records
  for (const record of records) {
    await prisma.financialRecord.create({
      data: record,
    });
  }

  console.log(`Created ${records.length} financial records`);

  console.log('Seed completed successfully!');
  console.log('\nTest accounts:');
  console.log('  Admin:   admin@example.com / Password123');
  console.log('  Analyst: analyst@example.com / Password123');
  console.log('  Viewer:  viewer@example.com / Password123');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
