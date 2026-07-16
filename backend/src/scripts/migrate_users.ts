import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany();
  
  for (const user of users) {
    let permissions: string[] = [];
    let jobTitle = user.role;
    let division = user.branchId ? 'Toko/Cabang' : 'Management';

    switch (user.role) {
      case 'Super Admin':
        permissions = ['Dashboard', 'CRM', 'B2B', 'BSB', 'POS', 'Laporan', 'Inventory', 'Master Data', 'Users', 'Promos'];
        division = 'Management';
        break;
      case 'Management':
        permissions = ['Dashboard', 'CRM', 'B2B', 'BSB', 'Laporan', 'Finance', 'Promos'];
        break;
      case 'Manager':
      case 'Leader':
        permissions = ['Dashboard', 'POS', 'Laporan', 'Inventory', 'CRM'];
        break;
      case 'Admin':
        permissions = ['Dashboard', 'POS', 'Laporan', 'Master Data', 'Users'];
        break;
      case 'Finance':
        permissions = ['Dashboard', 'Laporan'];
        division = 'Finance';
        break;
      default:
        permissions = ['POS'];
        break;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        permissions,
        jobTitle,
        division
      }
    });

    console.log(`Updated user ${user.id} (${user.email}) -> Role: ${user.role}, Division: ${division}`);
  }
  
  console.log('Migration complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
