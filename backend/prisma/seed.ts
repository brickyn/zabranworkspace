import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // 1. Create Branches
  const branch1 = await prisma.branch.upsert({
    where: { id: 'branch-001' },
    update: {
      name: 'Gudang/Warehouse utama Zabran',
    },
    create: {
      id: 'branch-001',
      name: 'Gudang/Warehouse utama Zabran',
      address: 'Pusat',
    },
  });

  const branch2 = await prisma.branch.upsert({
    where: { id: 'branch-002' },
    update: {
      name: 'Toko Laptop Murah Indonesia',
    },
    create: {
      id: 'branch-002',
      name: 'Toko Laptop Murah Indonesia',
      address: 'Cabang',
    },
  });

  console.log('Branches created');

  // 2. Create Users
  const passwordHash = await bcrypt.hash('admin123', 10);

  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@zabran.com' },
    update: { password: passwordHash },
    create: {
      id: '900001',
      email: 'admin@zabran.com',
      password: passwordHash,
      name: 'Dedi Trisniadi',
      role: 'Super Admin',
    },
  });

  const cashier = await prisma.user.upsert({
    where: { email: 'kasir1@zabran.com' },
    update: { branchId: branch1.id, password: passwordHash },
    create: {
      id: '100001',
      email: 'kasir1@zabran.com',
      password: passwordHash,
      name: 'Kasir Gudang Utama',
      role: 'Cashier',
      branchId: branch1.id,
    },
  });

  const cashierLMI = await prisma.user.upsert({
    where: { email: 'kasirlmi@zabran.com' },
    update: { branchId: branch2.id, password: passwordHash },
    create: {
      id: '100002',
      email: 'kasirlmi@zabran.com',
      password: passwordHash,
      name: 'Kasir LMI',
      role: 'Cashier',
      branchId: branch2.id,
    },
  });

  const gudang = await prisma.user.upsert({
    where: { email: 'warehouse@zabran.com' },
    update: { branchId: branch1.id, password: passwordHash },
    create: {
      id: '200001',
      email: 'warehouse@zabran.com',
      password: passwordHash,
      name: 'Admin Warehouse',
      role: 'Management',
      branchId: branch1.id,
    },
  });

  console.log('Users created');

  // Skip seeding products and transactions for now due to schema refactoring
  console.log('Dummy transactions skipped');

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
