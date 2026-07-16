import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database reset for inventory and transactions...');

  // Delete in order to respect foreign key constraints
  console.log('Deleting TransactionItems...');
  await prisma.transactionItem.deleteMany({});
  
  console.log('Deleting Transactions...');
  await prisma.transaction.deleteMany({});

  console.log('Deleting StockOpnameItems...');
  await prisma.stockOpnameItem.deleteMany({});
  
  console.log('Deleting StockOpnames...');
  await prisma.stockOpname.deleteMany({});

  console.log('Deleting StockTransfers...');
  await prisma.stockTransfer.deleteMany({});

  console.log('Deleting PurchaseOrderItems...');
  await prisma.purchaseOrderItem.deleteMany({});
  
  console.log('Deleting PurchaseOrders...');
  await prisma.purchaseOrder.deleteMany({});

  console.log('Deleting Products...');
  await prisma.product.deleteMany({});

  console.log('Inventory reset complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
