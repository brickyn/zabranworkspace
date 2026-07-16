"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.returnTransaction = exports.voidTransaction = exports.createTransaction = exports.getTransactions = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const transaction_validation_1 = require("../validations/transaction.validation");
const zod_1 = require("zod");
const websocket_1 = require("../utils/websocket");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const getTransactions = async (req, res) => {
    try {
        const { branch_id, start_date, end_date, status, page, pageSize } = req.query;
        const pageNum = Math.max(1, parseInt(String(page || '1')));
        const limit = Math.min(500, Math.max(1, parseInt(String(pageSize || '50'))));
        const skip = (pageNum - 1) * limit;
        const whereClause = {};
        if (branch_id)
            whereClause.branchId = branch_id;
        if (status)
            whereClause.status = status;
        // Role-based filtering
        if (req.user && ['Cashier', 'Leader', 'User'].includes(req.user.role) && req.user.branchId) {
            whereClause.branchId = req.user.branchId;
        }
        if (start_date && end_date) {
            whereClause.createdAt = {
                gte: new Date(start_date),
                lte: new Date(end_date),
            };
        }
        const [transactions, total] = await Promise.all([
            prisma_1.default.transaction.findMany({
                where: whereClause,
                include: {
                    customer: true,
                    cashier: { select: { id: true, name: true } },
                    items: {
                        include: { product: true }
                    }
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            prisma_1.default.transaction.count({ where: whereClause })
        ]);
        res.json({
            success: true,
            data: transactions,
            pagination: { page: pageNum, pageSize: limit, total, totalPages: Math.ceil(total / limit) }
        });
    }
    catch (error) {
        res.status(500).json({ success: false, error: 'Failed to fetch transactions' });
    }
};
exports.getTransactions = getTransactions;
const createTransaction = async (req, res) => {
    try {
        const validatedData = transaction_validation_1.createTransactionSchema.parse(req.body);
        const cashierId = req.user?.id;
        const branchId = req.user?.branchId || validatedData.branchId;
        // --- CONDITIONAL APPROVAL ENGINE (Task 5.2) ---
        const productIds = validatedData.items.map(item => item.productId);
        const dbProducts = await prisma_1.default.product.findMany({ where: { id: { in: productIds } } });
        let requiresApproval = false;
        let overrideReason = '';
        if (validatedData.paymentMethod === 'Tempo' || validatedData.paymentMethod === 'Piutang') {
            requiresApproval = true;
            overrideReason = 'Payment method requires manager approval.';
        }
        if (!requiresApproval) {
            for (const item of validatedData.items) {
                const dbProduct = dbProducts.find(p => p.id === item.productId);
                if (dbProduct) {
                    const discountPercent = (item.discount / dbProduct.sellPrice) * 100;
                    if (discountPercent > 20) {
                        requiresApproval = true;
                        overrideReason = 'Discount exceeds 20%. Requires manager approval.';
                        break;
                    }
                }
            }
        }
        if (requiresApproval) {
            if (!validatedData.overrideToken) {
                res.status(403).json({ success: false, error: overrideReason, requiresApproval: true });
                return;
            }
            // Validate override token
            try {
                const decoded = jsonwebtoken_1.default.verify(validatedData.overrideToken, process.env.JWT_SECRET);
                if (!['Super Admin', 'Owner', 'Manager'].includes(decoded.role)) {
                    throw new Error('Invalid role');
                }
            }
            catch (err) {
                res.status(403).json({ success: false, error: 'Invalid or expired override token.' });
                return;
            }
        }
        // ----------------------------------------------
        // Execute in a transaction to ensure ACID compliance
        const result = await prisma_1.default.$transaction(async (tx) => {
            // 1. Lock products using optimistic locking to prevent Double Selling
            const productIds = validatedData.items.map(item => item.productId);
            const lockedProducts = await tx.product.updateMany({
                where: {
                    id: { in: productIds },
                    status: 'Available',
                    branchId: branchId
                },
                data: { status: 'Reserved' } // Lock during transaction creation
            });
            if (lockedProducts.count !== productIds.length) {
                throw new Error('Beberapa produk tidak tersedia lagi atau sedang dalam proses transaksi lain. Silakan periksa kembali keranjang Anda.');
            }
            // 2. Handle Customer (Create if necessary)
            let finalCustomerId = validatedData.customerId;
            if (!finalCustomerId && validatedData.customerName) {
                // Try to find existing customer by phone or name to prevent duplicates
                let existingCustomer = null;
                if (validatedData.customerPhone) {
                    existingCustomer = await tx.customer.findFirst({ where: { phone: validatedData.customerPhone } });
                }
                if (!existingCustomer) {
                    existingCustomer = await tx.customer.findFirst({ where: { name: validatedData.customerName } });
                }
                if (existingCustomer) {
                    finalCustomerId = existingCustomer.id;
                }
                else {
                    const newCustomer = await tx.customer.create({
                        data: {
                            name: validatedData.customerName,
                            phone: validatedData.customerPhone,
                            points: 0
                        }
                    });
                    finalCustomerId = newCustomer.id;
                }
            }
            // 3. Create Transaction Header
            const transaction = await tx.transaction.create({
                data: {
                    id: validatedData.id,
                    branchId: branchId,
                    customerId: finalCustomerId,
                    cashierId: cashierId,
                    totalAmount: validatedData.total,
                    discount: validatedData.discount,
                    paymentMethod: validatedData.paymentMethod,
                    splitPayments: validatedData.splitPayments || undefined,
                    promoCampaignId: validatedData.promoCampaignId || undefined,
                    notes: validatedData.notes || undefined,
                    status: 'completed',
                    items: {
                        create: validatedData.items.map(item => ({
                            productId: item.productId,
                            sellingPrice: item.price,
                            discount: item.discount,
                            subtotal: item.subtotal
                        }))
                    }
                },
                include: {
                    items: {
                        include: { product: true }
                    },
                    customer: true
                }
            });
            // 4. Update Product Status to 'Sold' and Create Warranty if applicable
            await tx.product.updateMany({
                where: { id: { in: productIds } },
                data: { status: 'Sold' }
            });
            for (const item of transaction.items) {
                const product = item.product;
                if (product && product.durasiGaransi && product.satuanGaransi) {
                    const startDate = new Date();
                    let endDate = new Date();
                    if (product.satuanGaransi.toLowerCase() === 'hari') {
                        endDate.setDate(endDate.getDate() + product.durasiGaransi);
                    }
                    else if (product.satuanGaransi.toLowerCase() === 'minggu') {
                        endDate.setDate(endDate.getDate() + (product.durasiGaransi * 7));
                    }
                    else if (product.satuanGaransi.toLowerCase() === 'bulan') {
                        endDate.setMonth(endDate.getMonth() + product.durasiGaransi);
                    }
                    else if (product.satuanGaransi.toLowerCase() === 'tahun') {
                        endDate.setFullYear(endDate.getFullYear() + product.durasiGaransi);
                    }
                    await tx.warranty.create({
                        data: {
                            transactionItemId: item.id,
                            customerName: validatedData.customerName || transaction.customer?.name || 'Unknown Customer',
                            customerPhone: validatedData.customerPhone || transaction.customer?.phone || null,
                            startDate,
                            endDate,
                            type: `${product.durasiGaransi} ${product.satuanGaransi}`,
                            status: 'Active'
                        }
                    });
                }
            }
            // 5. Update Promo Usage Count if a voucher code was used
            if (validatedData.promoCode) {
                await tx.promoCampaign.update({
                    where: { voucherCode: validatedData.promoCode },
                    data: { usageCount: { increment: 1 } }
                });
            }
            // 6. Create Audit Log
            await tx.log.create({
                data: {
                    userId: cashierId,
                    action: 'CREATE_TRANSACTION',
                    details: `Processed transaction ${transaction.id} for total ${transaction.totalAmount}`
                }
            });
            return transaction;
        });
        // Broadcast real-time update to connected clients (e.g. Dashboard)
        (0, websocket_1.broadcastMessage)('NEW_TRANSACTION', { branchId: result.branchId, total: result.totalAmount });
        res.status(201).json({ success: true, message: 'Transaction successful', data: result });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({ success: false, error: error.errors });
            return;
        }
        // Handle Custom Thrown Errors inside $transaction
        if (error.message && (error.message.includes('not found') || error.message.includes('available') || error.message.includes('branch'))) {
            res.status(400).json({ success: false, error: error.message });
            return;
        }
        if (error.code === 'P2002') {
            res.status(400).json({ success: false, error: 'Transaction ID already exists' });
            return;
        }
        console.error(error);
        res.status(500).json({ success: false, error: 'Failed to process transaction' });
    }
};
exports.createTransaction = createTransaction;
const voidTransaction = async (req, res) => {
    try {
        const id = String(req.params.id);
        const result = await prisma_1.default.$transaction(async (tx) => {
            const transaction = await tx.transaction.findUnique({
                where: { id },
                include: { items: true }
            });
            if (!transaction)
                throw new Error('Transaction not found');
            if (transaction.status === 'voided')
                throw new Error('Transaction is already voided');
            // Update Transaction status
            const updatedTx = await tx.transaction.update({
                where: { id },
                data: { status: 'voided' }
            });
            // Revert Product Status
            for (const item of transaction.items) {
                await tx.product.update({
                    where: { id: item.productId },
                    data: { status: 'Available' }
                });
            }
            // Log action
            await tx.log.create({
                data: {
                    userId: req.user?.id || 'system',
                    action: 'VOID_TRANSACTION',
                    entityType: 'Transaction',
                    entityId: id,
                    details: `Voided transaction ${id}`,
                    ipAddress: req.ip || null
                }
            });
            // Create Notification for Manager & Super Admin
            await tx.notification.create({
                data: {
                    type: 'VOID_TRANSACTION',
                    title: 'Transaksi Dibatalkan',
                    message: `Transaksi ${id} telah di-void`,
                    referenceId: id,
                    targetRole: 'Management'
                }
            });
            return updatedTx;
        });
        (0, websocket_1.broadcastMessage)('TRANSACTION_VOIDED', { id: result.id, branchId: result.branchId });
        res.json({ success: true, data: result });
    }
    catch (error) {
        res.status(400).json({ success: false, error: error.message || 'Failed to void transaction' });
    }
};
exports.voidTransaction = voidTransaction;
const returnTransaction = async (req, res) => {
    try {
        const id = String(req.params.id);
        const { reason, returnToStock } = req.body;
        const cashierId = req.user?.id;
        const result = await prisma_1.default.$transaction(async (tx) => {
            const transaction = await tx.transaction.findUnique({
                where: { id },
                include: { items: true }
            });
            if (!transaction) {
                throw new Error('Transaction not found');
            }
            if (transaction.status === 'returned' || transaction.status === 'void') {
                throw new Error(`Transaction is already ${transaction.status}`);
            }
            // Update Transaction status
            const updatedTx = await tx.transaction.update({
                where: { id },
                data: { status: 'returned', returnReason: reason, returnedAt: new Date() }
            });
            // Handle stock and warranty
            for (const item of transaction.items) {
                if (returnToStock) {
                    await tx.product.update({
                        where: { id: item.productId },
                        data: { status: 'QC_Pending' } // Return items go to QC first
                    });
                }
                // Void warranty if exists
                await tx.warranty.updateMany({
                    where: { transactionItemId: item.id },
                    data: { status: 'Void' }
                });
            }
            // Deduct Customer Points if customer exists
            if (transaction.customerId) {
                const deductedPoints = Math.floor(transaction.totalAmount / 100000);
                if (deductedPoints > 0) {
                    await tx.customer.update({
                        where: { id: transaction.customerId },
                        data: { points: { decrement: deductedPoints } }
                    });
                }
            }
            // Audit Log
            await tx.log.create({
                data: {
                    userId: cashierId || 'system',
                    action: 'RETURN_TRANSACTION',
                    entityType: 'Transaction',
                    entityId: id,
                    details: `Returned transaction ${id}. Reason: ${reason}`,
                    ipAddress: req.ip || null
                }
            });
            return updatedTx;
        });
        res.json({ success: true, message: 'Transaction returned successfully', data: result });
    }
    catch (error) {
        console.error(error);
        if (error.message && (error.message.includes('not found') || error.message.includes('already'))) {
            res.status(400).json({ success: false, error: error.message });
            return;
        }
        res.status(500).json({ success: false, error: 'Failed to return transaction' });
    }
};
exports.returnTransaction = returnTransaction;
//# sourceMappingURL=transaction.controller.js.map