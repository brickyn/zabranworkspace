import { PrismaClient } from '@prisma/client';
import { JobQueue } from '../src/services/JobQueue';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Queue Engine Seeder/Tester...');

  // Enqueue 5 PDF generation jobs
  for (let i = 1; i <= 5; i++) {
    await JobQueue.enqueue(
      'PDF_GENERATION',
      'REPORTS',
      { reportId: `REP-${i}`, title: `Monthly Report ${i}` },
      { priority: i } // Higher priority first
    );
  }

  // Enqueue 1 Delayed Job (10 seconds from now)
  await JobQueue.enqueue(
    'EMAIL_DELIVERY',
    'COMMUNICATION',
    { to: 'manager@zabran.com', subject: 'Delayed Notification' },
    { delayMs: 10000 }
  );

  console.log(`✅ Jobs enqueued successfully! Check your worker console to see them being processed.`);
}

main()
  .catch((e) => {
    console.error('❌ Error in job seeder:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
