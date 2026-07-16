import { WorkflowInstance } from '@prisma/client';
export declare class WorkflowEngine {
    /**
     * Initialize a new workflow instance for an entity
     */
    static initializeInstance(workflowName: string, entityType: string, entityId: string, contextData?: any, userId?: string): Promise<WorkflowInstance>;
    /**
     * Get available transitions for a specific workflow instance
     */
    static getAvailableTransitions(instanceId: string, userId: string, userRole: string, userPermissions: string[]): Promise<({
        toState: {
            type: string;
            id: string;
            name: string;
            workflowId: string;
        };
    } & {
        id: string;
        workflowId: string;
        fromStateId: string;
        toStateId: string;
        conditions: import("@prisma/client/runtime/library").JsonValue | null;
        actions: import("@prisma/client/runtime/library").JsonValue | null;
        requiredRole: string | null;
        requiredPermission: string | null;
        requireDelegation: boolean;
    })[]>;
    /**
     * Execute a state transition
     */
    static executeTransition(instanceId: string, toStateName: string, userId: string, userRole: string, userPermissions: string[], comment?: string, contextUpdates?: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        entityType: string;
        entityId: string;
        workflowId: string;
        currentStateId: string;
        contextData: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    /**
     * Simple Rule Evaluator
     * Expects conditions format: { rules: [{ field: 'amount', operator: '>', value: 1000 }] }
     */
    private static evaluateConditions;
}
//# sourceMappingURL=WorkflowEngine.d.ts.map