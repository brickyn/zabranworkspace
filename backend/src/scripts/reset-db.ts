import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting data reset...');

  // Delete dependencies first
  await prisma.warranty.deleteMany({});
  console.log('Deleted Warranty');
  
  await prisma.transactionItem.deleteMany({});
  console.log('Deleted TransactionItem');
  
  await prisma.transaction.deleteMany({});
  console.log('Deleted Transaction');
  
  await prisma.stockOpnameItem.deleteMany({});
  console.log('Deleted StockOpnameItem');
  
  await prisma.stockOpname.deleteMany({});
  console.log('Deleted StockOpname');
  
  await prisma.stockTransfer.deleteMany({});
  console.log('Deleted StockTransfer');
  
  await prisma.product.deleteMany({});
  console.log('Deleted Product');
  
  console.log('Data reset complete.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
