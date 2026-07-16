import { PrismaClient, CustomFieldDefinition, EntityCustomData } from '@prisma/client';
import { EventBus } from './EventBus';
import logger from '../utils/logger';

const prisma = new PrismaClient();

export class MetadataEngineService {
  /**
   * Get all active custom fields for a specific entity type
   */
  public async getFieldsForEntity(entityType: string): Promise<CustomFieldDefinition[]> {
    return prisma.customFieldDefinition.findMany({
      where: { entityType, isActive: true },
      orderBy: { order: 'asc' }
    });
  }

  /**
   * Validate and save custom data for an entity
   */
  public async validateAndSaveData(entityType: string, entityId: string, payload: Record<string, any>) {
    const fields = await this.getFieldsForEntity(entityType);
    
    // 1. Validation
    const validatedData: Record<string, any> = {};
    for (const field of fields) {
      let value = payload[field.name];

      // Use default if missing
      if (value === undefined && field.defaultValue !== null) {
        value = field.defaultValue;
      }

      // Check required
      if (field.isRequired && (value === undefined || value === null || value === '')) {
        throw new Error(`Field ${field.label} (${field.name}) is required.`);
      }

      // Type specific validations could go here
      if (value !== undefined) {
        if (field.type === 'NUMBER' && isNaN(Number(value))) {
          throw new Error(`Field ${field.label} must be a number.`);
        }
        
        // Validation JSON (min, max, regex)
        if (field.validation && typeof field.validation === 'object') {
          const rules: any = field.validation;
          if (rules.min !== undefined && Number(value) < rules.min) {
            throw new Error(`Field ${field.label} must be at least ${rules.min}.`);
          }
          if (rules.max !== undefined && Number(value) > rules.max) {
            throw new Error(`Field ${field.label} must be at most ${rules.max}.`);
          }
          if (rules.regex) {
            const regex = new RegExp(rules.regex);
            if (!regex.test(String(value))) {
              throw new Error(`Field ${field.label} format is invalid.`);
            }
          }
        }
        
        validatedData[field.name] = value;
      }
    }

    // 2. Save Data
    const existingData = await prisma.entityCustomData.findUnique({
      where: { entityType_entityId: { entityType, entityId } }
    });

    // Merge existing JSON with new validated data
    const finalData = existingData ? { ...(existingData.data as any), ...validatedData } : validatedData;

    const savedData = await prisma.entityCustomData.upsert({
      where: { entityType_entityId: { entityType, entityId } },
      create: { entityType, entityId, data: finalData },
      update: { data: finalData }
    });

    // 3. Publish Event
    EventBus.publish({
      eventName: 'EntityCustomDataUpdated',
      sourceModule: 'METADATA',
      entityType,
      entityId,
      payload: finalData
    });

    return savedData;
  }

  /**
   * Get the custom data for an entity
   */
  public async getData(entityType: string, entityId: string) {
    const record = await prisma.entityCustomData.findUnique({
      where: { entityType_entityId: { entityType, entityId } }
    });
    return record?.data || {};
  }
}

export const MetadataEngine = new MetadataEngineService();
