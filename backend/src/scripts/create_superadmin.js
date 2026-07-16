const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');

async function main() {
  const defaultPassword = await bcrypt.hash('Zabran2026!', 10);
  await prisma.user.upsert({
    where: { email: 'superadmin@zabran.com' },
    update: { role: 'Super Admin', password: defaultPassword },
    create: {
      id: '999999',
      email: 'superadmin@zabran.com',
      password: defaultPassword,
      name: 'Super Admin',
      role: 'Super Admin',
      branchId: 'B-HQ-MGT'
    }
  });
  console.log('Super Admin account created/updated.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
