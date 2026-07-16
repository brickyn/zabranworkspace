"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboardMetrics = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const getDashboardMetrics = async (req, res) => {
    try {
        const { month, year, branchId, includeSewa } = req.query;
        // Build where clause for date filtering
        let dateFilter = {};
        if (month && year) {
            const startDate = new Date(Number(year), Number(month) - 1, 1);
            const endDate = new Date(Number(year), Number(month), 0, 23, 59, 59, 999);
            dateFilter = {
                createdAt: {
                    gte: startDate,
                    lte: endDate,
                }
            };
        }
        // Base transaction where clause
        const txWhere = {
            status: 'completed',
            ...dateFilter,
        };
        if (branchId && branchId !== 'all') {
            txWhere.branchId = String(branchId);
        }
        // Fetch transactions with items and products
        const transactions = await prisma_1.default.transaction.findMany({
            where: txWhere,
            include: {
                items: {
                    include: {
                        product: true
                    }
                }
            }
        });
        // Initialize metrics
        const metrics = {
            totalOmzet: 0,
            totalHpp: 0,
            totalProfit: 0,
            margin: 0,
            totalTransaksi: 0,
            laptop: { unit: 0, transaksi: 0, omzet: 0, aov: 0 },
            service: { unit: 0, transaksi: 0, omzet: 0, aov: 0 },
            aksesoris: { unit: 0, transaksi: 0, omzet: 0, aov: 0 },
            sewa: { unit: 0, transaksi: 0, omzet: 0, aov: 0 },
            b2b: { omzet: 0 },
            bsb: { omzet: 0 },
            crm: { repeatOrder: 0 },
        };
        // Calculate metrics
        const isIncludeSewa = includeSewa === 'true';
        transactions.forEach((tx) => {
            let txHasLaptop = false;
            let txHasService = false;
            let txHasAksesoris = false;
            let txHasSewa = false;
            let txSewaOmzet = 0;
            let txHpp = 0;
            tx.items.forEach((item) => {
                const cat = (item.product?.category || 'Laptop').toLowerCase();
                const buyPrice = item.product?.buyPrice || 0;
                txHpp += buyPrice;
                // Accumulate based on category
                if (cat === 'laptop' || cat === 'unit') {
                    metrics.laptop.unit += 1;
                    metrics.laptop.omzet += item.subtotal;
                    txHasLaptop = true;
                }
                else if (cat === 'service') {
                    metrics.service.unit += 1;
                    metrics.service.omzet += item.subtotal;
                    txHasService = true;
                }
                else if (cat === 'aksesoris' || cat === 'accessories') {
                    metrics.aksesoris.unit += 1;
                    metrics.aksesoris.omzet += item.subtotal;
                    txHasAksesoris = true;
                }
                else if (cat === 'sewa' || cat === 'rental') {
                    metrics.sewa.unit += 1;
                    metrics.sewa.omzet += item.subtotal;
                    txSewaOmzet += item.subtotal;
                    txHasSewa = true;
                }
            });
            // Count transactions per category
            if (txHasLaptop)
                metrics.laptop.transaksi += 1;
            if (txHasService)
                metrics.service.transaksi += 1;
            if (txHasAksesoris)
                metrics.aksesoris.transaksi += 1;
            if (txHasSewa)
                metrics.sewa.transaksi += 1;
            // Add to global totals
            let txTotalToAdd = tx.totalAmount;
            if (!isIncludeSewa && txHasSewa) {
                txTotalToAdd -= txSewaOmzet;
            }
            if (txTotalToAdd > 0) {
                metrics.totalOmzet += txTotalToAdd;
                metrics.totalHpp += txHpp;
                metrics.totalTransaksi += 1;
            }
        });
        metrics.totalProfit = metrics.totalOmzet - metrics.totalHpp;
        metrics.margin = metrics.totalOmzet > 0 ? (metrics.totalProfit / metrics.totalOmzet) * 100 : 0;
        // Fetch B2B & BSB
        const b2bWhere = {};
        const bsbWhere = {};
        if (month && year) {
            const startDate = new Date(Number(year), Number(month) - 1, 1);
            const endDate = new Date(Number(year), Number(month), 0, 23, 59, 59, 999);
            b2bWhere.date = { gte: startDate, lte: endDate };
            bsbWhere.date = { gte: startDate, lte: endDate };
        }
        const b2bTxs = await prisma_1.default.b2BTransaction.findMany({ where: b2bWhere });
        const bsbTxs = await prisma_1.default.bSBTransaction.findMany({ where: bsbWhere });
        metrics.b2b.omzet = b2bTxs.reduce((sum, t) => sum + t.amount, 0);
        metrics.bsb.omzet = bsbTxs.reduce((sum, t) => sum + t.amount, 0);
        // Calculate AOV
        if (metrics.laptop.transaksi > 0)
            metrics.laptop.aov = metrics.laptop.omzet / metrics.laptop.transaksi;
        if (metrics.service.transaksi > 0)
            metrics.service.aov = metrics.service.omzet / metrics.service.transaksi;
        if (metrics.aksesoris.transaksi > 0)
            metrics.aksesoris.aov = metrics.aksesoris.omzet / metrics.aksesoris.transaksi;
        if (metrics.sewa.transaksi > 0)
            metrics.sewa.aov = metrics.sewa.omzet / metrics.sewa.transaksi;
        // Fetch CRM Repeat Order
        const crmBranchFilter = (branchId && branchId !== 'all') ? { branchId: String(branchId) } : {};
        const allCrmData = await prisma_1.default.cRMCustomerData.findMany({ where: crmBranchFilter });
        const phoneCountMap = {};
        allCrmData.forEach(c => {
            const isPhoneValid = c.phone && c.phone.length > 5 && c.phone !== '-';
            if (!isPhoneValid)
                return;
            if (!phoneCountMap[c.phone]) {
                phoneCountMap[c.phone] = { total: 0, inPeriod: 0 };
            }
            phoneCountMap[c.phone].total += 1;
            let insidePeriod = false;
            if (month && year) {
                const pd = new Date(c.purchaseDate);
                const start = new Date(Number(year), Number(month) - 1, 1);
                const end = new Date(Number(year), Number(month), 0, 23, 59, 59, 999);
                if (pd >= start && pd <= end)
                    insidePeriod = true;
            }
            else {
                insidePeriod = true;
            }
            if (insidePeriod)
                phoneCountMap[c.phone].inPeriod += 1;
        });
        let repeatOrders = 0;
        Object.values(phoneCountMap).forEach(val => {
            if (val.inPeriod > 0 && val.total > 1) {
                repeatOrders += 1;
            }
        });
        metrics.crm.repeatOrder = repeatOrders;
        res.status(200).json({ success: true, data: metrics });
    }
    catch (error) {
        console.error('Error fetching dashboard metrics:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch dashboard metrics' });
    }
};
exports.getDashboardMetrics = getDashboardMetrics;
//# sourceMappingURL=dashboard.controller.js.map