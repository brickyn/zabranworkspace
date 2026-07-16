"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.importProducts = exports.importTransactions = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const xlsx_1 = require("xlsx");
/**
 * Import historical transactions from Excel
 * POST /api/v1/data-import/transactions
 * Excel columns: Tanggal, Kode TX, Cabang ID, Nama Produk, Harga Jual, HPP, Metode Bayar, Kasir ID
 */
const importTransactions = async (req, res) => {
    try {
        if (!req.file) {
            res.status(400).json({ success: false, error: 'No file uploaded' });
            return;
        }
        const branchId = req.body.branchId;
        if (!branchId) {
            res.status(400).json({ success: false, error: 'branchId is required' });
            return;
        }
        const workbook = (0, xlsx_1.read)(req.file.buffer, { type: 'buffer' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = xlsx_1.utils.sheet_to_json(sheet, { defval: null });
        let imported = 0;
        let skipped = 0;
        for (const row of rows) {
            try {
                const txId = String(row['Kode TX'] || `IMPORT-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`);
                const tanggal = row['Tanggal'] ? new Date(row['Tanggal']) : new Date();
                const namaBarang = String(row['Nama Produk'] || 'Produk Import');
                const hargaJual = Number(row['Harga Jual']) || 0;
                const hpp = Number(row['HPP'] || row['Harga Modal']) || 0;
                const metodeBayar = String(row['Metode Bayar'] || 'Cash');
                const cashierId = row['Kasir ID'] ? String(row['Kasir ID']) : null;
                const targetBranch = row['Cabang ID'] ? String(row['Cabang ID']) : branchId;
                // Check if transaction already exists
                const existing = await prisma_1.default.transaction.findUnique({ where: { id: txId } });
                if (existing) {
                    skipped++;
                    continue;
                }
                // Create product entry for the imported item
                const prodId = `IMP-${txId}-001`;
                await prisma_1.default.product.upsert({
                    where: { id: prodId },
                    update: {},
                    create: {
                        id: prodId,
                        name: namaBarang,
                        buyPrice: hpp,
                        sellPrice: hargaJual,
                        branchId: targetBranch,
                        status: 'Sold',
                        category: row['Kategori'] ? String(row['Kategori']) : 'Laptop',
                    },
                });
                // Create transaction
                await prisma_1.default.transaction.create({
                    data: {
                        id: txId,
                        branchId: targetBranch,
                        cashierId,
                        totalAmount: hargaJual,
                        paymentMethod: metodeBayar,
                        status: 'completed',
                        createdAt: tanggal,
                        items: {
                            create: [{
                                    productId: prodId,
                                    sellingPrice: hargaJual,
                                    subtotal: hargaJual,
                                }],
                        },
                    },
                });
                imported++;
            }
            catch (rowErr) {
                console.error('Skipping row due to error:', rowErr);
                skipped++;
            }
        }
        res.json({
            success: true,
            message: `Import selesai: ${imported} berhasil, ${skipped} dilewati`,
            data: { imported, skipped, total: rows.length },
        });
    }
    catch (error) {
        console.error('Error importing transactions:', error);
        res.status(500).json({ success: false, error: 'Import failed' });
    }
};
exports.importTransactions = importTransactions;
/**
 * Import products from Excel
 * POST /api/v1/data-import/products
 * Excel columns: ID Produk, Nama, Brand, Model, Kategori, Processor, RAM, Storage, GPU, HPP, Harga Jual, Cabang ID, Status, Serial Number
 */
const importProducts = async (req, res) => {
    try {
        if (!req.file) {
            res.status(400).json({ success: false, error: 'No file uploaded' });
            return;
        }
        const defaultBranchId = req.body.branchId;
        const workbook = (0, xlsx_1.read)(req.file.buffer, { type: 'buffer' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = xlsx_1.utils.sheet_to_json(sheet, { defval: null });
        if (rows.length === 0) {
            res.status(400).json({ success: false, error: 'File Excel kosong' });
            return;
        }
        let imported = 0;
        let skipped = 0;
        const errors = [];
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            try {
                // Flexible column mapping — support both English and Indonesian headers
                const id = String(row['ID Produk'] || row['id'] || row['ID'] || '').trim();
                const name = String(row['Nama'] || row['Name'] || row['Nama Produk'] || '').trim();
                const branchId = String(row['Cabang ID'] || row['branchId'] || row['Branch ID'] || defaultBranchId || '').trim();
                if (!id) {
                    errors.push(`Baris ${i + 2}: ID Produk wajib diisi`);
                    skipped++;
                    continue;
                }
                if (!name) {
                    errors.push(`Baris ${i + 2}: Nama produk wajib diisi`);
                    skipped++;
                    continue;
                }
                if (!branchId) {
                    errors.push(`Baris ${i + 2}: Cabang ID wajib diisi`);
                    skipped++;
                    continue;
                }
                const buyPrice = Number(row['HPP'] || row['Buy Price'] || row['Harga Modal'] || row['buyPrice'] || 0);
                const sellPrice = Number(row['Harga Jual'] || row['Sell Price'] || row['sellPrice'] || 0);
                // Check for existing ID
                const existing = await prisma_1.default.product.findUnique({ where: { id } });
                if (existing) {
                    errors.push(`Baris ${i + 2}: ID "${id}" sudah ada (dilewati)`);
                    skipped++;
                    continue;
                }
                // Validate branch
                const branch = await prisma_1.default.branch.findUnique({ where: { id: branchId } });
                if (!branch) {
                    errors.push(`Baris ${i + 2}: Cabang ID "${branchId}" tidak ditemukan`);
                    skipped++;
                    continue;
                }
                await prisma_1.default.product.create({
                    data: {
                        id,
                        name,
                        brand: row['Brand'] || row['brand'] || null,
                        model: row['Model'] || row['model'] || null,
                        category: row['Kategori'] || row['Category'] || row['category'] || 'Laptop',
                        processor: row['Processor'] || row['processor'] || null,
                        ram: row['RAM'] || row['ram'] || null,
                        storage: row['Storage'] || row['storage'] || null,
                        gpu: row['GPU'] || row['gpu'] || null,
                        serialNumber: row['Serial Number'] || row['serialNumber'] || row['SN'] || null,
                        buyPrice,
                        sellPrice,
                        status: row['Status'] || row['status'] || 'Available',
                        branchId,
                    }
                });
                imported++;
            }
            catch (rowErr) {
                errors.push(`Baris ${i + 2}: ${rowErr.message || 'Error tidak diketahui'}`);
                skipped++;
            }
        }
        res.json({
            success: true,
            message: `Import produk selesai: ${imported} berhasil, ${skipped} dilewati`,
            data: { imported, skipped, total: rows.length, errors: errors.slice(0, 20) }, // Return max 20 errors
        });
    }
    catch (error) {
        console.error('Error importing products:', error);
        res.status(500).json({ success: false, error: 'Gagal mengimpor produk' });
    }
};
exports.importProducts = importProducts;
//# sourceMappingURL=dataImport.controller.js.map