"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DomainEvents = void 0;
var DomainEvents;
(function (DomainEvents) {
    DomainEvents["WorkflowTransitioned"] = "Workflow.Transitioned";
    DomainEvents["WorkflowActionRequested"] = "Workflow.ActionRequested";
    DomainEvents["InventoryReserved"] = "Inventory.Reserved";
    DomainEvents["InventoryReleased"] = "Inventory.Released";
    DomainEvents["InventoryTransferred"] = "Inventory.Transferred";
    DomainEvents["ProductCreated"] = "Product.Created";
    DomainEvents["ProductUpdated"] = "Product.Updated";
    DomainEvents["ProductDeleted"] = "Product.Deleted";
    DomainEvents["SaleCreated"] = "Sale.Created";
    DomainEvents["SaleCompleted"] = "Sale.Completed";
    DomainEvents["SaleRefunded"] = "Sale.Refunded";
    DomainEvents["UserCreated"] = "User.Created";
    DomainEvents["RoleDelegated"] = "Role.Delegated";
})(DomainEvents || (exports.DomainEvents = DomainEvents = {}));
//# sourceMappingURL=events.js.map