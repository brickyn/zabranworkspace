"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cancelOpname = exports.verifyOpname = exports.updateItemNotes = exports.uploadOpname = exports.downloadTemplate = exports.initOpname = exports.getOpnameDetail = exports.getOpnames = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const xlsx = __importStar(require("xlsx"));
// 1. Get SO List per branch (or all)
const getOpnames = async (req, res) => {
    try {
        const { branchId } = req.query;
        const where = {};
        if (branchId && branchId !== 'all') {
            where.branchId = String(branchId);
        }
        // For non-superadmins, force their own branch
        if (req.user?.role !== 'Super Admin' && req.user?.role !== 'Management' && req.user?.role !== 'Finance') {
            if (req.user?.branchId) {
                where.branchId = req.user.branchId;
            }
        }
        const opnames = await prisma_1.default.stockOpname.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: {
                branch: { select: { name: true } },
                _count: { select: { items: true } }
            }
        });
        res.json({ success: true, data: opnames });
    }
    catch (error) {
        res.status(500).json({ success: false, error: 'Gagal mengambil data SO' });
    }
};
exports.getOpnames = getOpnames;
// 2. Get Single SO Detail
const getOpnameDetail = async (req, res) => {
    try {
        const id = String(req.params.id);
        const opname = await prisma_1.default.stockOpname.findUnique({
            where: { id },
            include: {
                branch: { select: { name: true } },
                items: {
                    include: {
                        product: { select: { name: true, category: true, status: true } }
                    }
                }
            }
        });
        if (!opname) {
            res.status(404).json({ success: false, error: 'SO tidak ditemukan' });
            return;
        }
        res.json({ success: true, data: opname });
    }
    catch (error) {
        res.status(500).json({ success: false, error: 'Gagal mengambil detail SO' });
    }
};
exports.getOpnameDetail = getOpnameDetail;
// 3. Init SO
const initOpname = async (req, res) => {
    try {
        const { branchId, notes } = req.body;
        if (!branchId) {
            res.status(400).json({ success: false, error: 'branchId diperlukan' });
            return;
        }
        // Check if there is an active SO for this branch
        const activeSO = await prisma_1.default.stockOpname.findFirst({
            where: { branchId, status: { in: ['In Progress', 'Review'] } }
        });
        if (activeSO) {
            res.status(400).json({ success: false, error: 'Ada proses SO yang belum selesai untuk cabang ini' });
            return;
        }
        const opname = await prisma_1.default.stockOpname.create({
            data: {
                branchId,
                notes,
                status: 'In Progress',
                startTime: new Date()
            }
        });
        res.status(201).json({ success: true, data: opname });
    }
    catch (error) {
        res.status(500).json({ success: false, error: 'Gagal memulai SO' });
    }
};
exports.initOpname = initOpname;
// 4. Download Template
const downloadTemplate = async (req, res) => {
    try {
        const { branchId } = req.params;
        // In Blind Count, we just give an empty Excel with "Serial Number" column
        const wb = xlsx.utils.book_new();
        const ws = xlsx.utils.aoa_to_sheet([
            ['Serial Number (Scan Barcode di Sini)']
        ]);
        // Set column width
        ws['!cols'] = [{ wch: 40 }];
        xlsx.utils.book_append_sheet(wb, ws, 'SO_Template');
        const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
        res.setHeader('Content-Disposition', `attachment; filename="SO_Template_${branchId}.xlsx"`);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(buffer);
    }
    catch (error) {
        res.status(500).json({ success: false, error: 'Gagal mengunduh template' });
    }
};
exports.downloadTemplate = downloadTemplate;
// 5. Upload & Process Excel
const uploadOpname = async (req, res) => {
    try {
        const id = String(req.params.id);
        const opname = await prisma_1.default.stockOpname.findUnique({ where: { id } });
        if (!opname) {
            res.status(404).json({ success: false, error: 'SO tidak ditemukan' });
            return;
        }
        if (opname.status !== 'In Progress') {
            res.status(400).json({ success: false, error: 'SO sudah diproses / diverifikasi' });
            return;
        }
        const file = req.file;
        if (!file) {
            res.status(400).json({ success: false, error: 'File Excel tidak ditemukan' });
            return;
        }
        const workbook = xlsx.read(file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 });
        // Extact scanned SNs (assuming column A)
        const scannedSNs = new Set();
        for (let i = 1; i < data.length; i++) {
            const sn = String(data[i][0] || '').trim();
            if (sn)
                scannedSNs.add(sn);
        }
        // Get all expected products for this branch (Available or Booked)
        const expectedProducts = await prisma_1.default.product.findMany({
            where: {
                branchId: opname.branchId,
                status: { in: ['Available', 'Booked'] }
            }
        });
        const expectedMap = new Map(expectedProducts.map(p => [p.id, p]));
        const opnameItems = [];
        // 1. Check MATCH and MISSING
        for (const product of expectedProducts) {
            if (scannedSNs.has(product.id)) {
                opnameItems.push({
                    productId: product.id,
                    serialNumber: product.id,
                    expectedQty: 1,
                    actualQty: 1,
                    diffStatus: 'MATCH'
                });
                scannedSNs.delete(product.id);
            }
            else {
                opnameItems.push({
                    productId: product.id,
                    serialNumber: product.id,
                    expectedQty: 1,
                    actualQty: 0,
                    diffStatus: 'MISSING'
                });
            }
        }
        // 2. Check UNEXPECTED (scanned but not in expected products)
        for (const sn of scannedSNs) {
            // Check if it exists in DB at all (maybe another branch)
            const existingProduct = await prisma_1.default.product.findUnique({ where: { id: sn } });
            opnameItems.push({
                productId: existingProduct ? existingProduct.id : null,
                serialNumber: sn,
                expectedQty: 0,
                actualQty: 1,
                diffStatus: 'UNEXPECTED'
            });
        }
        // Run transaction: Create items and update SO status
        await prisma_1.default.$transaction(async (tx) => {
            // delete old items if they uploaded again
            await tx.stockOpnameItem.deleteMany({ where: { opnameId: id } });
            if (opnameItems.length > 0) {
                await tx.stockOpnameItem.createMany({
                    data: opnameItems.map(item => ({
                        opnameId: id,
                        ...item
                    }))
                });
            }
            await tx.stockOpname.update({
                where: { id },
                data: {
                    status: 'Review',
                    uploadTime: new Date()
                }
            });
        });
        res.json({ success: true, message: 'File SO berhasil diproses' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Gagal memproses file SO' });
    }
};
exports.uploadOpname = uploadOpname;
// 6. Update Notes for Items
const updateItemNotes = async (req, res) => {
    try {
        const id = String(req.params.id);
        const itemId = String(req.params.itemId);
        const { notes } = req.body;
        await prisma_1.default.stockOpnameItem.update({
            where: { id: itemId, opnameId: id },
            data: { notes }
        });
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ success: false, error: 'Gagal menyimpan catatan' });
    }
};
exports.updateItemNotes = updateItemNotes;
// 7. Verify SO
const verifyOpname = async (req, res) => {
    try {
        const id = String(req.params.id);
        await prisma_1.default.stockOpname.update({
            where: { id },
            data: {
                status: 'Verified',
                verifiedAt: new Date()
            }
        });
        res.json({ success: true, message: 'SO berhasil diverifikasi' });
    }
    catch (error) {
        res.status(500).json({ success: false, error: 'Gagal memverifikasi SO' });
    }
};
exports.verifyOpname = verifyOpname;
// 8. Cancel SO
const cancelOpname = async (req, res) => {
    try {
        const id = String(req.params.id);
        const { reason } = req.body;
        if (!reason) {
            res.status(400).json({ success: false, error: 'Alasan pembatalan harus diisi' });
            return;
        }
        const opname = await prisma_1.default.stockOpname.findUnique({ where: { id } });
        if (!opname) {
            res.status(404).json({ success: false, error: 'SO tidak ditemukan' });
            return;
        }
        if (opname.status === 'Verified') {
            res.status(400).json({ success: false, error: 'SO yang sudah diverifikasi tidak dapat dibatalkan' });
            return;
        }
        const updatedNotes = opname.notes
            ? `${opname.notes}\n\nDIBATALKAN: ${reason}`
            : `DIBATALKAN: ${reason}`;
        await prisma_1.default.stockOpname.update({
            where: { id },
            data: {
                status: 'Cancelled',
                notes: updatedNotes
            }
        });
        res.json({ success: true, message: 'SO berhasil dibatalkan' });
    }
    catch (error) {
        res.status(500).json({ success: false, error: 'Gagal membatalkan SO' });
    }
};
exports.cancelOpname = cancelOpname;
//# sourceMappingURL=stock-opname.controller.js.map