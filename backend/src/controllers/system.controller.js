"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetDummyData = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma_1 = __importDefault(require("../prisma"));
const logger_1 = __importDefault(require("../utils/logger"));
const resetDummyData = async (req, res) => {
    try {
        const { adminPassword } = req.body;
        // Verify admin password
        // Get user from token payload (injected by authenticateJWT)
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ success: false, error: 'Unauthorized' });
            return;
        }
        const user = await prisma_1.default.user.findUnique({ where: { id: userId } });
        if (!user) {
            res.status(401).json({ success: false, error: 'User not found' });
            return;
        }
        const isValid = await bcryptjs_1.default.compare(adminPassword, user.password);
        if (!isValid) {
            res.status(401).json({ success: false, error: 'Invalid admin password' });
            return;
        }
        logger_1.default.warn(`DANGER: Super Admin ${user.email} initiated database dummy data reset.`);
        await prisma_1.default.$transaction(async (tx) => {
            // 1. Transaction & Payment
            await tx.transactionItem.deleteMany();
            await tx.transaction.deleteMany();
            // 2. Purchases & Expenses
            await tx.purchaseOrderItem.deleteMany();
            await tx.purchaseOrder.deleteMany();
            await tx.expense.deleteMany();
            // 3. Inventory Movements
            await tx.stockOpnameItem.deleteMany();
            await tx.stockOpname.deleteMany();
            await tx.transferOrder.deleteMany();
            await tx.stockTransfer.deleteMany();
            // 4. Cash Management
            await tx.cashManagement.deleteMany();
            // 5. CRM
            await tx.cRMActivity.deleteMany();
            await tx.cRMDailyReview.deleteMany();
            await tx.cRMMysteryGuest.deleteMany();
            // 6. B2B & BSB
            await tx.b2BTransaction.deleteMany();
            await tx.b2BMaintenanceLog.deleteMany();
            await tx.b2BActivity.deleteMany();
            await tx.b2BSchedule.deleteMany();
            await tx.bSBTransaction.deleteMany();
            await tx.bSBActivity.deleteMany();
            await tx.bSBExpense.deleteMany();
            // 7. Services & Rentals
            await tx.serviceJob.deleteMany();
            await tx.rental.deleteMany();
            await tx.warranty.deleteMany();
            // Reset Product Stocks to 0
            await tx.product.updateMany({
                data: {
                    stock: 0,
                    status: 'Available' // Assuming status resets to available
                }
            });
        }, {
            timeout: 30000 // allow up to 30s for heavy deletion
        });
        logger_1.default.info(`SUCCESS: Database dummy data reset completed by ${user.email}.`);
        res.json({ success: true, message: 'Data dummy berhasil dibersihkan, stok produk kembali ke 0. Master Data tetap dipertahankan.' });
    }
    catch (error) {
        logger_1.default.error('Failed to reset dummy data', error);
        res.status(500).json({ success: false, error: 'Failed to reset dummy data', details: error.message });
    }
};
exports.resetDummyData = resetDummyData;
//# sourceMappingURL=system.controller.js.map