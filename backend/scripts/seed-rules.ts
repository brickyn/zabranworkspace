import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Rule Engine Seeder...');

  // 1. Discount Rule (If Role = Cashier AND Discount > 20 -> REJECT)
  await prisma.businessRule.upsert({
    where: { name: 'CASHIER_DISCOUNT_LIMIT' },
    update: {},
    create: {
      name: 'CASHIER_DISCOUNT_LIMIT',
      description: 'Cashiers cannot give more than 20% discount without approval',
      module: 'POS',
      category: 'DISCOUNT',
      priority: 100,
      stopProcessing: true,
      conditions: {
        operator: 'AND',
        rules: [
          { field: 'role', operator: '==', value: 'Cashier' },
          { field: 'discountPercentage', operator: '>', value: 20 }
        ]
      },
      actions: [
        { type: 'REQUIRE_APPROVAL', payload: { requiredRole: 'Manager' } }
      ]
    }
  });

  // 2. VIP Customer Rule
  await prisma.businessRule.upsert({
    where: { name: 'VIP_CUSTOMER_DISCOUNT' },
    update: {},
    create: {
      name: 'VIP_CUSTOMER_DISCOUNT',
      description: 'VIP Customers automatically get a 30% discount if limit not hit',
      module: 'POS',
      category: 'DISCOUNT',
      priority: 50,
      stopProcessing: false,
      conditions: {
        operator: 'AND',
        rules: [
          { field: 'customerType', operator: '==', value: 'VIP' }
        ]
      },
      actions: [
        { type: 'GRANT_DISCOUNT', payload: { discountPercentage: 30 } }
      ]
    }
  });

  console.log(`✅ Business Rules created successfully!`);
}

main()
  .catch((e) => {
    console.error('❌ Error in rule seeder:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
