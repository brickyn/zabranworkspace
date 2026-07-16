import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('Zabran2026!', 10);
  await prisma.user.update({
    where: { email: 'superadmin@zabran.com' },
    data: { password: hashedPassword }
  });
  console.log('Password reset successfully for superadmin@zabran.com');
}

main().catch(console.error).finally(() => prisma.$disconnect());
