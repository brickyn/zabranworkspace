import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Starting user & role reset...');

  // 1. Delete all existing Users and Roles to start fresh
  console.log('🗑️ Deleting all existing users...');
  await prisma.user.deleteMany({});
  
  console.log('🗑️ Deleting all existing roles...');
  await prisma.role.deleteMany({});

  const passwordHash = await bcrypt.hash('password123', 10);

  // 2. Define Roles
  const roles = [
    'Super Admin',
    'Owner',
    'Manager',
    'Cashier',
    'Warehouse Staff',
    'B2B Admin',
    'Marketing',
    'Technician',
    'Finance'
  ];

  console.log('✨ Creating Roles...');
  const roleMap: Record<string, string> = {};
  for (const roleName of roles) {
    const role = await prisma.role.create({
      data: {
        name: roleName,
        isSystem: true,
      }
    });
    roleMap[roleName] = role.id;
  }

  // Ensure branch exists for assignment
  const branch1 = await prisma.branch.upsert({
    where: { id: 'branch-001' },
    update: {},
    create: {
      id: 'branch-001',
      name: 'Cabang Utama Jakarta',
      address: 'Jl. Sudirman No. 1, Jakarta',
    },
  });

  // 3. Create Users
  console.log('✨ Creating Users...');
  const usersToCreate = [
    {
      id: '900001',
      email: 'admin@zabran.com',
      name: 'Super Admin',
      role: 'Super Admin',
      jobTitle: 'Super Administrator',
    },
    {
      id: '900002',
      email: 'owner@zabran.com',
      name: 'Owner Zabran',
      role: 'Owner',
      jobTitle: 'Business Owner',
    },
    {
      id: '800001',
      email: 'manager@zabran.com',
      name: 'Manager Operasional',
      role: 'Manager',
      jobTitle: 'Branch Manager',
    },
    {
      id: '100001',
      email: 'kasir1@zabran.com',
      name: 'Budi Kasir',
      role: 'Cashier',
      jobTitle: 'Frontdesk Cashier',
    },
    {
      id: '200001',
      email: 'gudang@zabran.com',
      name: 'Siti Gudang',
      role: 'Warehouse Staff',
      jobTitle: 'Inventory Keeper',
    },
    {
      id: '300001',
      email: 'b2b@zabran.com',
      name: 'Agus B2B',
      role: 'B2B Admin',
      jobTitle: 'B2B Sales Representative',
    },
    {
      id: '400001',
      email: 'marketing@zabran.com',
      name: 'Tika Marketing',
      role: 'Marketing',
      jobTitle: 'Digital Marketing Specialist',
    },
    {
      id: '500001',
      email: 'teknisi@zabran.com',
      name: 'Joko Teknisi',
      role: 'Technician',
      jobTitle: 'Senior Technician',
    },
    {
      id: '600001',
      email: 'finance@zabran.com',
      name: 'Dewi Finance',
      role: 'Finance',
      jobTitle: 'Finance & Accounting',
    }
  ];

  for (const u of usersToCreate) {
    await prisma.user.create({
      data: {
        id: u.id,
        email: u.email,
        password: passwordHash,
        name: u.name,
        role: u.role, // Legacy string role
        roleId: roleMap[u.role], // Relational role
        jobTitle: u.jobTitle,
        branchId: branch1.id
      }
    });
    console.log(`✅ Created User: ${u.email} (${u.role})`);
  }

  console.log('🎉 Reset Users successfully completed!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
