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
exports.exportLaporan = exports.getLaporan = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const xlsx = __importStar(require("xlsx"));
const getLaporan = async (req, res) => {
    try {
        const { branchId, startDate, endDate } = req.query;
        const whereClause = {};
        if (branchId && branchId !== 'all') {
            whereClause.branchId = branchId;
        }
        if (startDate && endDate) {
            whereClause.createdAt = {
                gte: new Date(startDate),
                lte: new Date(endDate),
            };
        }
        const transactions = await prisma_1.default.transaction.findMany({
            where: whereClause,
            include: {
                cashier: true,
                customer: true,
                items: {
                    include: {
                        product: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json({ success: true, data: transactions });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Failed to fetch reports' });
    }
};
exports.getLaporan = getLaporan;
const exportLaporan = async (req, res) => {
    try {
        const { branchId, startDate, endDate, type } = req.query;
        const exportType = type || 'full'; // 'full' | 'sales' | 'expense'
        const dateFilter = {};
        const whereBranch = {};
        if (branchId && branchId !== 'all') {
            whereBranch.branchId = branchId;
        }
        if (startDate && endDate) {
            dateFilter.gte = new Date(startDate);
            dateFilter.lte = new Date(endDate);
        }
        const workbook = xlsx.utils.book_new();
        // ─── SHEET 1: Penjualan Toko (Laptop, Service, Aksesoris, Sewa) ───
        if (exportType === 'full' || exportType === 'sales') {
            const txWhereClause = { ...whereBranch };
            if (startDate && endDate) {
                txWhereClause.createdAt = dateFilter;
            }
            const transactions = await prisma_1.default.transaction.findMany({
                where: txWhereClause,
                include: {
                    cashier: true,
                    customer: true,
                    branch: true,
                    items: { include: { product: true } }
                },
                orderBy: { createdAt: 'desc' }
            });
            const salesData = [];
            let sumHargaBeli = 0, sumHargaJual = 0, sumTotal = 0, sumDiskon = 0;
            transactions.forEach(tx => {
                tx.items.forEach(item => {
                    const product = item.product;
                    sumHargaBeli += product.buyPrice;
                    sumHargaJual += item.sellingPrice;
                    sumTotal += item.subtotal;
                    sumDiskon += item.discount;
                    salesData.push({
                        'Tanggal': new Date(tx.createdAt).toLocaleDateString('id-ID'),
                        'Kode Transaksi': tx.id,
                        'Cabang': tx.branch?.name || '-',
                        'Kategori': product.category || 'Laptop',
                        'Kode Barang': product.id,
                        'Nama Barang': product.name,
                        'Harga Beli': product.buyPrice,
                        'Harga Jual': item.sellingPrice,
                        'Diskon': item.discount,
                        'Total': item.subtotal,
                        'Metode Bayar': tx.paymentMethod,
                        'Kasir': tx.cashier?.name || '-',
                        'Pelanggan': tx.customer?.name || 'Umum',
                    });
                });
            });
            salesData.push({
                'Tanggal': '══ TOTAL ══',
                'Kode Transaksi': '', 'Cabang': '', 'Kategori': '', 'Kode Barang': '', 'Nama Barang': '',
                'Harga Beli': sumHargaBeli, 'Harga Jual': sumHargaJual, 'Diskon': sumDiskon, 'Total': sumTotal,
                'Metode Bayar': '', 'Kasir': '', 'Pelanggan': ''
            });
            const ws1 = xlsx.utils.json_to_sheet(salesData);
            xlsx.utils.book_append_sheet(workbook, ws1, 'Penjualan Toko');
        }
        // ─── SHEET 2: Divisi B2B ───
        if (exportType === 'full' || exportType === 'sales') {
            const b2bWhere = {};
            if (startDate && endDate)
                b2bWhere.date = dateFilter;
            const b2bTxs = await prisma_1.default.b2BTransaction.findMany({
                where: b2bWhere,
                include: { partner: true },
                orderBy: { date: 'desc' }
            });
            const b2bData = b2bTxs.map(tx => ({
                'Tanggal': new Date(tx.date).toLocaleDateString('id-ID'),
                'Client / Perusahaan': tx.partner?.name || '-',
                'Jenis': tx.type || '-',
                'Item': tx.itemName || '-',
                'Jumlah': tx.qty,
                'Nominal': tx.amount,
                'PIC': tx.picName || '-',
            }));
            if (b2bData.length > 0) {
                const totalB2B = b2bTxs.reduce((acc, tx) => acc + tx.amount, 0);
                b2bData.push({ 'Tanggal': '══ TOTAL ══', 'Client / Perusahaan': '', 'Jenis': '', 'Item': '', 'Jumlah': '', 'Nominal': totalB2B, 'PIC': '' });
            }
            const ws2 = xlsx.utils.json_to_sheet(b2bData.length ? b2bData : [{ 'Info': 'Tidak ada data B2B di periode ini' }]);
            xlsx.utils.book_append_sheet(workbook, ws2, 'Divisi B2B');
        }
        // ─── SHEET 3: Divisi BSB ───
        if (exportType === 'full' || exportType === 'sales') {
            const bsbWhere = {};
            if (startDate && endDate)
                bsbWhere.date = dateFilter;
            const bsbTxs = await prisma_1.default.bSBTransaction.findMany({
                where: bsbWhere,
                orderBy: { date: 'desc' }
            });
            const bsbData = bsbTxs.map(tx => ({
                'Tanggal': new Date(tx.date).toLocaleDateString('id-ID'),
                'Jenis': tx.type,
                'Platform': tx.platform,
                'Jumlah': tx.qty,
                'Nominal': tx.amount,
                'Status Pengiriman': tx.shippingStatus,
                'PIC': tx.picName || '-',
            }));
            if (bsbData.length > 0) {
                const totalBSB = bsbTxs.reduce((acc, tx) => acc + tx.amount, 0);
                bsbData.push({ 'Tanggal': '══ TOTAL ══', 'Jenis': '', 'Platform': '', 'Jumlah': '', 'Nominal': totalBSB, 'Status Pengiriman': '', 'PIC': '' });
            }
            const ws3 = xlsx.utils.json_to_sheet(bsbData.length ? bsbData : [{ 'Info': 'Tidak ada data BSB di periode ini' }]);
            xlsx.utils.book_append_sheet(workbook, ws3, 'Divisi BSB');
        }
        // ─── SHEET 4: Beban (Expenses) ───
        if (exportType === 'full' || exportType === 'expense') {
            const expWhere = { ...whereBranch };
            if (startDate && endDate)
                expWhere.date = dateFilter;
            const expenses = await prisma_1.default.expense.findMany({
                where: expWhere,
                include: { branch: true },
                orderBy: { date: 'desc' }
            });
            const expenseData = expenses.map(exp => ({
                'Tanggal': new Date(exp.date).toLocaleDateString('id-ID'),
                'Divisi / Cabang': exp.branch?.name || '-',
                'Kategori': exp.category,
                'Keterangan': exp.description || '-',
                'Nominal': exp.amount,
            }));
            if (expenseData.length > 0) {
                const totalExp = expenses.reduce((acc, exp) => acc + exp.amount, 0);
                expenseData.push({ 'Tanggal': '══ TOTAL ══', 'Divisi / Cabang': '', 'Kategori': '', 'Keterangan': '', 'Nominal': totalExp });
            }
            const ws4 = xlsx.utils.json_to_sheet(expenseData.length ? expenseData : [{ 'Info': 'Tidak ada data beban di periode ini' }]);
            xlsx.utils.book_append_sheet(workbook, ws4, 'Beban Operasional');
        }
        // ─── SHEET 5: Ringkasan P&L ───
        if (exportType === 'full') {
            const txWhereClause = { ...whereBranch, status: 'completed' };
            if (startDate && endDate)
                txWhereClause.createdAt = dateFilter;
            const [allTx, allRentals, allB2B, allBSB, allExp] = await Promise.all([
                prisma_1.default.transaction.findMany({ where: txWhereClause, include: { items: { include: { product: true } } } }),
                prisma_1.default.rental.findMany({ where: { ...whereBranch, ...(startDate && endDate ? { createdAt: dateFilter } : {}) } }),
                prisma_1.default.b2BTransaction.findMany({ where: { ...(startDate && endDate ? { date: dateFilter } : {}) } }),
                prisma_1.default.bSBTransaction.findMany({ where: { ...(startDate && endDate ? { date: dateFilter } : {}) } }),
                prisma_1.default.expense.findMany({ where: { ...whereBranch, ...(startDate && endDate ? { date: dateFilter } : {}) } })
            ]);
            let incLaptop = 0, incService = 0, incAksesoris = 0, cogs = 0;
            allTx.forEach(tx => {
                tx.items.forEach(item => {
                    const cat = item.product.category?.toLowerCase() || '';
                    if (cat.includes('service'))
                        incService += item.subtotal;
                    else if (cat.includes('aksesoris') || cat.includes('accessories'))
                        incAksesoris += item.subtotal;
                    else
                        incLaptop += item.subtotal;
                    cogs += item.product.buyPrice;
                });
            });
            const incSewa = allRentals.reduce((acc, r) => acc + r.totalFee, 0);
            const incB2B = allB2B.reduce((acc, b) => acc + b.amount, 0);
            const incBSB = allBSB.reduce((acc, b) => acc + b.amount, 0);
            const totalIncome = incLaptop + incService + incAksesoris + incSewa + incB2B + incBSB;
            const grossProfit = totalIncome - cogs;
            const totalExpense = allExp.reduce((acc, e) => acc + e.amount, 0);
            const netProfit = grossProfit - totalExpense;
            const summaryData = [
                { 'Keterangan': '═══ PENDAPATAN ═══', 'Nominal': '' },
                { 'Keterangan': 'Penjualan Laptop', 'Nominal': incLaptop },
                { 'Keterangan': 'Penjualan Service', 'Nominal': incService },
                { 'Keterangan': 'Penjualan Aksesoris', 'Nominal': incAksesoris },
                { 'Keterangan': 'Pendapatan Sewa', 'Nominal': incSewa },
                { 'Keterangan': 'Divisi B2B', 'Nominal': incB2B },
                { 'Keterangan': 'Divisi BSB', 'Nominal': incBSB },
                { 'Keterangan': 'TOTAL PENDAPATAN', 'Nominal': totalIncome },
                { 'Keterangan': '', 'Nominal': '' },
                { 'Keterangan': '═══ HARGA POKOK ═══', 'Nominal': '' },
                { 'Keterangan': 'COGS (Harga Beli)', 'Nominal': cogs },
                { 'Keterangan': 'LABA KOTOR', 'Nominal': grossProfit },
                { 'Keterangan': '', 'Nominal': '' },
                { 'Keterangan': '═══ BEBAN OPERASIONAL ═══', 'Nominal': '' },
                { 'Keterangan': 'Total Beban', 'Nominal': totalExpense },
                { 'Keterangan': '', 'Nominal': '' },
                { 'Keterangan': '══ LABA BERSIH ══', 'Nominal': netProfit },
            ];
            const ws5 = xlsx.utils.json_to_sheet(summaryData);
            xlsx.utils.book_append_sheet(workbook, ws5, 'Ringkasan P&L');
        }
        const excelBuffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
        const fileName = exportType === 'expense'
            ? `Laporan_Beban_${startDate}_sd_${endDate}.xlsx`
            : `Laporan_Keuangan_Lengkap_${startDate}_sd_${endDate}.xlsx`;
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
        res.send(excelBuffer);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Failed to export reports' });
    }
};
exports.exportLaporan = exportLaporan;
//# sourceMappingURL=laporan.controller.js.map