import { PrismaClient } from '@prisma/client';
import { MetadataEngine } from '../src/services/MetadataEngine';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Metadata Engine Seeder/Tester...');

  // 1. Create a Schema (Custom Field) for "Product"
  console.log('>> Defining Custom Schema for "Product"...');
  
  await prisma.customFieldDefinition.upsert({
    where: { entityType_name: { entityType: 'Product', name: 'warranty_months' } },
    update: {},
    create: {
      module: 'INVENTORY',
      entityType: 'Product',
      name: 'warranty_months',
      label: 'Warranty Period (Months)',
      type: 'NUMBER',
      isRequired: true,
      validation: { min: 6, max: 60 } // Warranty must be between 6 and 60 months
    }
  });

  await prisma.customFieldDefinition.upsert({
    where: { entityType_name: { entityType: 'Product', name: 'material_type' } },
    update: {},
    create: {
      module: 'INVENTORY',
      entityType: 'Product',
      name: 'material_type',
      label: 'Material Type',
      type: 'SELECT',
      isRequired: false,
      options: ['Wood', 'Metal', 'Plastic', 'Glass']
    }
  });

  // 2. Test Validation: Should Fail (Missing required field)
  console.log('>> Testing Validation (Expected to Fail: Missing required field)...');
  try {
    await MetadataEngine.validateAndSaveData('Product', 'prod-123', {});
    console.error('❌ Validation bypassed incorrectly!');
  } catch (e: any) {
    console.log(`✅ Caught expected error: ${e.message}`);
  }

  // 3. Test Validation: Should Fail (Out of bounds)
  console.log('>> Testing Validation (Expected to Fail: Out of bounds)...');
  try {
    await MetadataEngine.validateAndSaveData('Product', 'prod-123', { warranty_months: 3 });
    console.error('❌ Validation bypassed incorrectly!');
  } catch (e: any) {
    console.log(`✅ Caught expected error: ${e.message}`);
  }

  // 4. Test Validation: Should Pass
  console.log('>> Testing Validation (Expected to Pass)...');
  await MetadataEngine.validateAndSaveData('Product', 'prod-123', { warranty_months: 12, material_type: 'Wood' });
  console.log(`✅ Data saved successfully!`);

  const savedData = await MetadataEngine.getData('Product', 'prod-123');
  console.log('>> Retrieved Data:', savedData);
}

main()
  .catch((e) => {
    console.error('❌ Error in metadata seeder:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
