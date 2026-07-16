"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('Migrating existing StockTransfers to TransferOrders...');
    const transfers = await prisma.stockTransfer.findMany({
        where: { transferOrderId: null },
        include: { product: true }
    });
    if (transfers.length === 0) {
        console.log('No legacy transfers found.');
        return;
    }
    // Group by batchId (or a pseudo-batch if null)
    const grouped = new Map();
    transfers.forEach(t => {
        const key = t.batchId || `legacy-${t.id}`;
        if (!grouped.has(key))
            grouped.set(key, []);
        grouped.get(key).push(t);
    });
    let migratedCount = 0;
    for (const [batchId, items] of grouped.entries()) {
        const firstItem = items[0];
        // Determine overall status based on items
        let overallStatus = 'Dispatched';
        if (items.every(i => i.status === 'Received')) {
            overallStatus = 'Completed';
        }
        else if (items.some(i => i.status === 'Returned')) {
            overallStatus = 'Partially Received';
        }
        else if (items.every(i => i.status === 'Pending')) {
            overallStatus = 'Draft';
        }
        const transferOrder = await prisma.transferOrder.create({
            data: {
                transferNumber: `TO-LEGACY-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
                doNumber: batchId.startsWith('legacy') ? null : batchId,
                fromBranchId: firstItem.fromBranchId,
                toBranchId: firstItem.toBranchId,
                status: overallStatus,
                notes: 'Migrated from legacy StockTransfer',
                dispatchDate: firstItem.createdAt, // approximation
                createdAt: firstItem.createdAt,
            }
        });
        await prisma.stockTransfer.updateMany({
            where: { id: { in: items.map(i => i.id) } },
            data: { transferOrderId: transferOrder.id }
        });
        migratedCount++;
    }
    console.log(`Successfully migrated ${transfers.length} items into ${migratedCount} TransferOrders.`);
}
main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
//# sourceMappingURL=migrate_transfers.js.map