"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProductLogs = exports.bulkReceiveTransfers = exports.updateTransferStatus = exports.createTransfers = exports.getSuratJalanById = exports.getTransfers = exports.setPromotion = exports.batchEdit = exports.bulkImport = exports.addStock = exports.validateSerialNumber = exports.getStockSummary = exports.getStock = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const xlsx_1 = require("xlsx");
// Helper to parse Excel file buffer into JSON rows
function parseExcel(buffer) {
    const workbook = (0, xlsx_1.read)(buffer, { type: 'buffer' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const json = xlsx_1.utils.sheet_to_json(worksheet, { defval: null });
    return json.map(row => {
        let processor = '', ram = '', storage = '', gpu = '';
        const specStr = row['Processor / Ram / HDD + SSD / VGA'];
        if (specStr && typeof specStr === 'string') {
            const parts = specStr.split('/');
            processor = parts[0] || '';
            ram = parts[1] || '';
            storage = parts[2] || '';
            gpu = parts[3] || '';
        }
        return {
            id: String(row['Batch Code'] || Math.random().toString(36).substr(2, 9)),
            name: row['Nama Barang'] || 'Unknown Product',
            serialNumber: row['Serial Number'] ? String(row['Serial Number']) : null,
            minus: row['Minus'] || null,
            processor, ram, storage, gpu,
            buyPrice: Number(row['Harga Modal']) || 0,
            sellPrice: Number(row['Harga Jual']) || 0,
            brand: row['Merk Laptop'] || null,
            model: row['Tipe Laptop'] || null,
            durasiGaransi: row['Durasi Garansi'] ? parseInt(row['Durasi Garansi']) : null,
            satuanGaransi: row['Satuan Garansi'] || null,
            status: 'Available',
        };
    });
}
const getStock = async (req, res) => {
    try {
        const { product_id, branch_id, category, status } = req.query;
        const whereClause = { deletedAt: null };
        if (product_id)
            whereClause.id = product_id;
        if (branch_id)
            whereClause.branchId = branch_id;
        whereClause.status = status ? status : 'Available';
        if (category && category !== 'all')
            whereClause.category = category;
        const products = await prisma_1.default.product.findMany({
            where: whereClause,
            include: { branch: true },
            orderBy: { createdAt: 'desc' },
        });
        res.json({ success: true, data: products });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Failed to fetch inventory stock' });
    }
};
exports.getStock = getStock;
const getStockSummary = async (req, res) => {
    try {
        const { branch_id } = req.query;
        const branchId = branch_id || req.user?.branchId;
        const whereClause = {};
        if (branchId && branchId !== 'all') {
            whereClause.branchId = branchId;
        }
        // Group by status
        const statusCounts = await prisma_1.default.product.groupBy({
            by: ['status'],
            where: whereClause,
            _count: {
                id: true,
            }
        });
        let warehouseStock = 0;
        let reservedStock = 0;
        let inTransit = 0;
        let availableStock = 0;
        statusCounts.forEach(item => {
            const count = item._count.id;
            // All items physically or logically belonging to this branch's warehouse pool
            // Excludes Sold, Return_Supplier unless they are considered outside warehouse.
            if (['Available', 'Reserved', 'Damaged', 'Service', 'QC_Pending'].includes(item.status)) {
                warehouseStock += count;
            }
            if (item.status === 'Reserved')
                reservedStock += count;
            if (item.status === 'In Transit') {
                inTransit += count;
                // In Transit is sometimes considered part of warehouse stock until received
                warehouseStock += count;
            }
            if (item.status === 'Available')
                availableStock += count;
        });
        // Enforce formula: Available = Warehouse Stock - Reserved Stock - In Transit
        // Our status-based approach already isolates 'Available', but we'll return the breakdown.
        res.json({
            success: true,
            data: {
                warehouseStock,
                reservedStock,
                inTransit,
                availableStock,
                formulaCheck: availableStock === (warehouseStock - reservedStock - inTransit)
            }
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Failed to fetch stock summary' });
    }
};
exports.getStockSummary = getStockSummary;
const validateSerialNumber = async (req, res) => {
    try {
        const { serial_number, branch_id } = req.body;
        const targetBranch = branch_id || req.user?.branchId;
        if (!serial_number || !targetBranch) {
            return res.status(400).json({ success: false, error: 'serial_number and branch_id are required' });
        }
        const product = await prisma_1.default.product.findFirst({
            where: {
                branchId: targetBranch,
                deletedAt: null,
                OR: [
                    { id: serial_number },
                    { serialNumber: serial_number }
                ]
            },
        });
        if (!product) {
            return res.status(404).json({ success: false, error: 'Produk tidak ditemukan di cabang ini' });
        }
        if (product.status !== 'Available') {
            return res.status(400).json({ success: false, error: `Product is currently ${product.status}` });
        }
        res.json({
            success: true,
            data: {
                is_valid: true,
                product: { id: product.id, name: product.name, price: product.sellPrice },
            },
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Failed to validate serial number' });
    }
};
exports.validateSerialNumber = validateSerialNumber;
const addStock = async (req, res) => {
    try {
        const data = req.body;
        const product = await prisma_1.default.product.create({ data });
        res.status(201).json({ success: true, data: product });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Failed to add stock' });
    }
};
exports.addStock = addStock;
const bulkImport = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: 'No file uploaded' });
        }
        const rows = parseExcel(req.file.buffer);
        const branchId = req.user?.branchId || req.body.branchId;
        if (!branchId) {
            return res.status(400).json({ success: false, error: 'Branch ID is required' });
        }
        await prisma_1.default.$transaction(rows.map((row) => prisma_1.default.product.upsert({
            where: { id: String(row.id) },
            update: { ...row, branchId },
            create: { ...row, branchId },
        })));
        res.json({ success: true, message: `${rows.length} products imported/updated` });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Bulk import failed' });
    }
};
exports.bulkImport = bulkImport;
const batchEdit = async (req, res) => {
    try {
        const updates = req.body;
        await prisma_1.default.$transaction(updates.map((item) => prisma_1.default.product.update({
            where: { id: item.id },
            data: item.updates,
        })));
        res.json({ success: true, message: `${updates.length} products updated` });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Batch edit failed' });
    }
};
exports.batchEdit = batchEdit;
const setPromotion = async (req, res) => {
    try {
        const { id } = req.params;
        const { promoPrice } = req.body;
        const product = await prisma_1.default.product.update({
            where: { id: String(id) },
            data: { promoPrice },
        });
        res.json({ success: true, data: product });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Failed to set promotion' });
    }
};
exports.setPromotion = setPromotion;
// ─── Stock Transfers (Enterprise WMS Workflow) ───
const getTransfers = async (req, res) => {
    try {
        const { branchId, status } = req.query;
        const user = req.user;
        const where = {};
        if (user && !['Super Admin', 'Management', 'Manager', 'Finance'].includes(user.role)) {
            where.OR = [{ fromBranchId: user.branchId }, { toBranchId: user.branchId }];
        }
        else if (branchId && branchId !== 'all') {
            where.OR = [{ fromBranchId: branchId }, { toBranchId: branchId }];
        }
        if (status)
            where.status = status;
        const transfers = await prisma_1.default.transferOrder.findMany({
            where,
            include: {
                fromBranch: { select: { name: true } },
                toBranch: { select: { name: true } },
                items: {
                    include: { product: { select: { id: true, name: true, category: true, brand: true, model: true, condition: true, serialNumber: true } } }
                }
            },
            orderBy: { createdAt: 'desc' },
        });
        res.json({ success: true, data: transfers });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Failed to fetch transfers' });
    }
};
exports.getTransfers = getTransfers;
const getSuratJalanById = async (req, res) => {
    try {
        const batchId = String(req.params.batchId); // Using batchId parameter, which might be TO ID or doNumber
        const decodedBatchId = decodeURIComponent(batchId);
        const transferOrder = await prisma_1.default.transferOrder.findFirst({
            where: {
                OR: [
                    { transferNumber: decodedBatchId },
                    { doNumber: decodedBatchId },
                    { id: decodedBatchId }
                ]
            },
            include: {
                fromBranch: { select: { id: true, name: true, address: true, phone: true } },
                toBranch: { select: { id: true, name: true, address: true, phone: true } },
                items: {
                    include: { product: { select: { id: true, name: true, brand: true, model: true, serialNumber: true, category: true, condition: true, grade: true } } }
                }
            }
        });
        if (!transferOrder) {
            return res.status(404).json({ success: false, error: 'Transfer Order tidak ditemukan' });
        }
        // Format to match what frontend expects (legacy format compatibility)
        res.json({
            success: true,
            data: {
                batchId: transferOrder.doNumber || transferOrder.transferNumber,
                transferOrder: transferOrder,
                transfers: transferOrder.items // legacy fallback
            }
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Failed to fetch Surat Jalan' });
    }
};
exports.getSuratJalanById = getSuratJalanById;
const createTransfers = async (req, res) => {
    try {
        const { items, toBranchId, notes, fromBranchId: reqFromBranchId } = req.body;
        const fromBranchId = reqFromBranchId || req.user?.branchId;
        if (!fromBranchId || !toBranchId || !items || !items.length) {
            return res.status(400).json({ success: false, error: 'Invalid data' });
        }
        const products = await prisma_1.default.product.findMany({
            where: { id: { in: items }, branchId: fromBranchId, status: 'Available', deletedAt: null },
        });
        if (products.length !== items.length) {
            return res.status(400).json({ success: false, error: 'Beberapa produk tidak ditemukan atau tidak tersedia' });
        }
        // Generate unique Transfer Number
        const now = new Date();
        const dateStr = now.toISOString().slice(2, 10).replace(/-/g, '');
        const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        const transferNumber = `TO-${dateStr}-${randomSuffix}`;
        // Create Draft Transfer Order
        const [transferOrder] = await prisma_1.default.$transaction([
            prisma_1.default.transferOrder.create({
                data: {
                    transferNumber,
                    fromBranchId,
                    toBranchId,
                    status: 'Draft',
                    notes,
                    createdBy: req.user?.name,
                    items: {
                        create: products.map(p => ({
                            fromBranchId,
                            toBranchId,
                            productId: p.id,
                            status: 'Pending'
                        }))
                    }
                },
                include: { items: true }
            }),
            prisma_1.default.product.updateMany({
                where: { id: { in: items } },
                data: { status: 'Reserved' }
            })
        ]);
        // Audit log
        await prisma_1.default.log.create({
            data: {
                userId: req.user?.id,
                action: 'CREATE_TRANSFER',
                entityType: 'TransferOrder',
                entityId: transferOrder.id,
                details: `Transfer Order ${transferNumber} dibuat (DRAFT). ${products.length} item untuk dikirim dari ${fromBranchId} ke ${toBranchId}.`,
                ipAddress: req.ip || null
            }
        });
        res.status(201).json({ success: true, message: `Transfer ${transferNumber} dibuat (Draft)`, data: transferOrder });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Failed to create transfer order' });
    }
};
exports.createTransfers = createTransfers;
const updateTransferStatus = async (req, res) => {
    try {
        const id = String(req.params.id);
        const { status, reason } = req.body;
        const transfer = await prisma_1.default.transferOrder.findUnique({
            where: { id },
            include: { items: true, fromBranch: true, toBranch: true }
        });
        if (!transfer)
            return res.status(404).json({ success: false, error: 'Transfer Order tidak ditemukan' });
        // Ensure valid transitions
        const validTransitions = {
            'Draft': ['Approved', 'Cancelled'],
            'Approved': ['Ready to Pick', 'Cancelled'],
            'Ready to Pick': ['Picking', 'Cancelled'],
            'Picking': ['Ready to Ship', 'Cancelled'],
            'Ready to Ship': ['Dispatched', 'Cancelled'],
            'Dispatched': ['In Transit'],
            'In Transit': ['Cancelled'], // Cancellation during transit only before receiving
            'Partially Received': ['Completed'], // Once received starts, can only complete
            'Received': ['Completed'],
        };
        if (!validTransitions[transfer.status]?.includes(status)) {
            return res.status(400).json({ success: false, error: `Transisi status tidak valid dari ${transfer.status} ke ${status}` });
        }
        const operations = [];
        let doNumber = transfer.doNumber;
        if (status === 'Cancelled') {
            if (!reason)
                return res.status(400).json({ success: false, error: 'Alasan pembatalan wajib diisi' });
            // If cancelled at any stage before Received, revert stock to Available at fromBranch
            operations.push(prisma_1.default.product.updateMany({
                where: { id: { in: transfer.items.map((i) => i.productId) } },
                data: { status: 'Available' } // Revert to available at source branch
            }));
            operations.push(prisma_1.default.transferOrder.update({ where: { id }, data: { status, notes: `Cancelled: ${reason}` } }));
            operations.push(prisma_1.default.stockTransfer.updateMany({ where: { transferOrderId: id }, data: { status: 'Cancelled' } }));
        }
        else if (status === 'Dispatched') {
            // Generate DO Number (Surat Jalan)
            const now = new Date();
            const dateStr = String(now.getDate()).padStart(2, '0');
            const romanMonths = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
            const branchCode = transfer.toBranch?.name ? transfer.toBranch.name.split(' ').map((w) => w[0]).join('').toUpperCase() : 'BR';
            doNumber = `${Math.floor(Math.random() * 999).toString().padStart(3, '0')}/${branchCode}/STB/BA-ZBN/${dateStr}/${romanMonths[now.getMonth()]}/${now.getFullYear()}`;
            // Decrease warehouse stock (Set to In Transit)
            operations.push(prisma_1.default.product.updateMany({
                where: { id: { in: transfer.items.map((i) => i.productId) } },
                data: { status: 'In Transit' }
            }));
            operations.push(prisma_1.default.transferOrder.update({ where: { id }, data: { status, doNumber, dispatchDate: new Date() } }));
            operations.push(prisma_1.default.stockTransfer.updateMany({ where: { transferOrderId: id }, data: { status: 'Shipped' } }));
            // Create notification for destination branch
            operations.push(prisma_1.default.notification.create({
                data: {
                    type: 'TRANSFER_PENDING',
                    title: 'Stok Masuk (Surat Jalan)',
                    message: `Surat Jalan ${doNumber} — ${transfer.items.length} item telah dikirim.`,
                    referenceId: id,
                }
            }));
        }
        else {
            operations.push(prisma_1.default.transferOrder.update({ where: { id }, data: { status } }));
        }
        await prisma_1.default.$transaction(operations);
        // Audit log
        await prisma_1.default.log.create({
            data: {
                userId: req.user?.id,
                action: `TRANSFER_${status.toUpperCase().replace(/ /g, '_')}`,
                entityType: 'TransferOrder',
                entityId: id,
                details: `Status berubah dari ${transfer.status} ke ${status}${reason ? ' - ' + reason : ''}`,
                ipAddress: req.ip || null
            }
        });
        res.json({ success: true, message: `Status berhasil diubah menjadi ${status}` });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Gagal mengubah status transfer' });
    }
};
exports.updateTransferStatus = updateTransferStatus;
const bulkReceiveTransfers = async (req, res) => {
    try {
        const id = String(req.params.id); // TransferOrder ID
        const { items } = req.body;
        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ success: false, error: 'Invalid data' });
        }
        const transferOrder = await prisma_1.default.transferOrder.findUnique({
            where: { id },
            include: { items: true }
        });
        if (!transferOrder || !['In Transit', 'Dispatched'].includes(transferOrder.status)) {
            return res.status(400).json({ success: false, error: 'Transfer Order tidak dalam perjalanan' });
        }
        const operations = [];
        let acceptedCount = 0;
        let rejectedCount = 0;
        for (const reqItem of items) {
            const lineItem = transferOrder.items.find((i) => i.id === reqItem.id);
            if (!lineItem || lineItem.status !== 'Shipped')
                continue;
            if (reqItem.accepted) {
                // Accept: Move to destination branch, set to Available
                operations.push(prisma_1.default.stockTransfer.update({ where: { id: lineItem.id }, data: { status: 'Received' } }));
                operations.push(prisma_1.default.product.update({ where: { id: lineItem.productId }, data: { branchId: transferOrder.toBranchId, status: 'Available' } }));
                acceptedCount++;
            }
            else {
                // Reject: Return to source branch, set to Available
                operations.push(prisma_1.default.stockTransfer.update({ where: { id: lineItem.id }, data: { status: 'Returned', notes: reqItem.reason || 'Ditolak tanpa alasan' } }));
                operations.push(prisma_1.default.product.update({ where: { id: lineItem.productId }, data: { branchId: transferOrder.fromBranchId, status: 'Available' } }));
                rejectedCount++;
            }
        }
        if (operations.length === 0) {
            return res.status(400).json({ success: false, error: 'Tidak ada item valid untuk diproses' });
        }
        // Determine new TO status
        const newStatus = rejectedCount > 0 ? 'Partially Received' : 'Received';
        operations.push(prisma_1.default.transferOrder.update({ where: { id }, data: { status: newStatus } }));
        await prisma_1.default.$transaction(operations);
        // Audit log
        await prisma_1.default.log.create({
            data: {
                userId: req.user?.id,
                action: 'RECEIVE_TRANSFER',
                entityType: 'TransferOrder',
                entityId: id,
                details: `Validasi fisik penerimaan (DO: ${transferOrder.doNumber || 'N/A'}). Diterima: ${acceptedCount}, Ditolak: ${rejectedCount}.`,
                ipAddress: req.ip || null
            }
        });
        res.json({ success: true, message: `Penerimaan diproses. Diterima: ${acceptedCount}, Diretur: ${rejectedCount}` });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Failed to process bulk receive', details: error.message });
    }
};
exports.bulkReceiveTransfers = bulkReceiveTransfers;
const getProductLogs = async (req, res) => {
    try {
        const productId = String(req.params.productId);
        const logs = await prisma_1.default.log.findMany({
            where: {
                OR: [
                    { entityId: productId, entityType: 'Product' },
                    { details: { contains: productId } },
                ]
            },
            include: { user: { select: { id: true, name: true, role: true } } },
            orderBy: { createdAt: 'desc' },
            take: 100,
        });
        res.json({ success: true, data: logs });
    }
    catch (error) {
        res.status(500).json({ success: false, error: 'Failed to fetch product logs' });
    }
};
exports.getProductLogs = getProductLogs;
//# sourceMappingURL=inventory.controller.js.map