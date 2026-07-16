export declare enum DomainEvents {
    WorkflowTransitioned = "Workflow.Transitioned",
    WorkflowActionRequested = "Workflow.ActionRequested",// To trigger external modules
    InventoryReserved = "Inventory.Reserved",
    InventoryReleased = "Inventory.Released",
    InventoryTransferred = "Inventory.Transferred",
    ProductCreated = "Product.Created",
    ProductUpdated = "Product.Updated",
    ProductDeleted = "Product.Deleted",
    SaleCreated = "Sale.Created",
    SaleCompleted = "Sale.Completed",
    SaleRefunded = "Sale.Refunded",
    UserCreated = "User.Created",
    RoleDelegated = "Role.Delegated"
}
export interface DomainEventPayload {
    eventName: DomainEvents | string;
    sourceModule: string;
    entityType: string;
    entityId: string;
    branchId?: string;
    triggeredBy?: string;
    correlationId?: string;
    payload: any;
    metadata?: any;
}
//# sourceMappingURL=events.d.ts.map