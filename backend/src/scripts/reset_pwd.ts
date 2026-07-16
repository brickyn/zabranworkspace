import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@zabran.com';
  const newPassword = 'password123';
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  
  await prisma.user.upsert({
    where: { email },
    update: { password: hashedPassword, role: 'Super Admin', isActive: true },
    create: {
      id: 'USR-999',
      email,
      name: 'Super Admin',
      password: hashedPassword,
      role: 'Super Admin',
      isActive: true
    }
  });
  console.log(`Password for ${email} reset to: ${newPassword}`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
