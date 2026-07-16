import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({ select: { id: true, email: true, role: true } });
  console.log("Users in DB:", users.filter(u => u.role === 'Super Admin' || u.email.includes('superadmin')));
}
main().catch(console.error).finally(() => prisma.$disconnect());
