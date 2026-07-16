import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Workflow Seeder...');

  // 1. Create Workflow Definition
  const workflow = await prisma.workflowDefinition.upsert({
    where: { name: 'INVENTORY_TRANSFER_V1' },
    update: {},
    create: {
      name: 'INVENTORY_TRANSFER_V1',
      module: 'INVENTORY',
      description: 'Standard inventory transfer between branches',
      version: 1
    }
  });

  console.log(`✅ Workflow Definition created: ${workflow.name}`);

  // 2. Create States
  const statesData = [
    { name: 'Draft', type: 'INITIAL' },
    { name: 'Approved', type: 'INTERMEDIATE' },
    { name: 'Dispatched', type: 'INTERMEDIATE' },
    { name: 'In Transit', type: 'INTERMEDIATE' },
    { name: 'Received', type: 'FINAL' },
    { name: 'Cancelled', type: 'CANCELLED' }
  ];

  const states: Record<string, string> = {};
  for (const s of statesData) {
    const state = await prisma.workflowState.upsert({
      where: { workflowId_name: { workflowId: workflow.id, name: s.name } },
      update: {},
      create: {
        workflowId: workflow.id,
        name: s.name,
        type: s.type
      }
    });
    states[s.name] = state.id;
  }

  console.log(`✅ Workflow States created`);

  // 3. Create Transitions
  const transitionsData = [
    {
      from: 'Draft',
      to: 'Approved',
      requiredRole: 'Manager',
      conditions: { rules: [{ field: 'totalItems', operator: '>', value: 0 }] },
      actions: ['NOTIFY_WAREHOUSE']
    },
    {
      from: 'Draft',
      to: 'Cancelled',
      requiredRole: null,
      conditions: null,
      actions: []
    },
    {
      from: 'Approved',
      to: 'Dispatched',
      requiredRole: 'Warehouse Staff',
      conditions: null,
      actions: ['RESERVE_INVENTORY']
    },
    {
      from: 'Approved',
      to: 'Cancelled',
      requiredRole: 'Manager',
      conditions: null,
      actions: []
    },
    {
      from: 'Dispatched',
      to: 'In Transit',
      requiredRole: 'Warehouse Staff',
      conditions: null,
      actions: ['UPDATE_LOGISTICS']
    },
    {
      from: 'In Transit',
      to: 'Received',
      requiredRole: 'Warehouse Staff', // At destination branch (logic to be handled in service)
      conditions: null,
      actions: ['RELEASE_INVENTORY', 'UPDATE_STOCK']
    }
  ];

  for (const t of transitionsData) {
    await prisma.workflowTransition.upsert({
      where: {
        workflowId_fromStateId_toStateId: {
          workflowId: workflow.id,
          fromStateId: states[t.from],
          toStateId: states[t.to]
        }
      },
      update: {
        requiredRole: t.requiredRole,
        conditions: t.conditions ? t.conditions : undefined,
        actions: t.actions ? t.actions : undefined
      },
      create: {
        workflowId: workflow.id,
        fromStateId: states[t.from],
        toStateId: states[t.to],
        requiredRole: t.requiredRole,
        conditions: t.conditions ? t.conditions : undefined,
        actions: t.actions ? t.actions : undefined
      }
    });
  }

  console.log(`✅ Workflow Transitions created`);
  console.log('🎉 Workflow Seeder completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error in seeder:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
