import { CustomFieldDefinition } from '@prisma/client';
export declare class MetadataEngineService {
    /**
     * Get all active custom fields for a specific entity type
     */
    getFieldsForEntity(entityType: string): Promise<CustomFieldDefinition[]>;
    /**
     * Validate and save custom data for an entity
     */
    validateAndSaveData(entityType: string, entityId: string, payload: Record<string, any>): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        data: import("@prisma/client/runtime/library").JsonValue;
        entityType: string;
        entityId: string;
    }>;
    /**
     * Get the custom data for an entity
     */
    getData(entityType: string, entityId: string): Promise<string | number | true | import("@prisma/client/runtime/library").JsonObject | import("@prisma/client/runtime/library").JsonArray>;
}
export declare const MetadataEngine: MetadataEngineService;
//# sourceMappingURL=MetadataEngine.d.ts.map