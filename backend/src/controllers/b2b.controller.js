"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getB2BMetrics = exports.createMaintenanceLog = exports.getMaintenanceLogs = exports.createTransaction = exports.getTransactions = exports.createBatchSchedules = exports.createSchedule = exports.getSchedules = exports.createActivity = exports.getActivities = exports.deletePartner = exports.updatePartner = exports.createPartner = exports.getPartners = void 0;
const prisma_1 = __importDefault(require("../prisma"));
// ─── B2B Partners ───
const getPartners = async (req, res) => {
    try {
        const { status } = req.query;
        const where = {};
        if (status && status !== 'all')
            where.status = status;
        const partners = await prisma_1.default.b2BPartner.findMany({
            where,
            include: { activities: { orderBy: { date: 'desc' }, take: 5 } },
            orderBy: { createdAt: 'desc' },
        });
        res.json({ success: true, data: partners });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Failed to fetch partners' });
    }
};
exports.getPartners = getPartners;
const createPartner = async (req, res) => {
    try {
        const partner = await prisma_1.default.b2BPartner.create({ data: req.body });
        res.status(201).json({ success: true, data: partner });
    }
    catch (error) {
        res.status(500).json({ success: false, error: 'Failed to create partner' });
    }
};
exports.createPartner = createPartner;
const updatePartner = async (req, res) => {
    try {
        const id = String(req.params.id);
        const partner = await prisma_1.default.b2BPartner.update({ where: { id }, data: req.body });
        res.json({ success: true, data: partner });
    }
    catch (error) {
        res.status(500).json({ success: false, error: 'Failed to update' });
    }
};
exports.updatePartner = updatePartner;
const deletePartner = async (req, res) => {
    try {
        const id = String(req.params.id);
        await prisma_1.default.b2BActivity.deleteMany({ where: { partnerId: id } });
        await prisma_1.default.b2BTransaction.deleteMany({ where: { partnerId: id } });
        await prisma_1.default.b2BMaintenanceLog.deleteMany({ where: { partnerId: id } });
        await prisma_1.default.b2BPartner.delete({ where: { id } });
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ success: false, error: 'Failed to delete' });
    }
};
exports.deletePartner = deletePartner;
// ─── B2B Activities ───
const getActivities = async (req, res) => {
    try {
        const { partnerId, month, year } = req.query;
        const where = {};
        if (partnerId)
            where.partnerId = String(partnerId);
        if (month && year) {
            const start = new Date(Number(year), Number(month) - 1, 1);
            const end = new Date(Number(year), Number(month), 0, 23, 59, 59);
            where.date = { gte: start, lte: end };
        }
        else if (req.query.startDate && req.query.endDate) {
            where.date = {
                gte: new Date(req.query.startDate),
                lte: new Date(req.query.endDate),
            };
        }
        const activities = await prisma_1.default.b2BActivity.findMany({
            where,
            include: { partner: { select: { name: true, company: true } } },
            orderBy: { date: 'desc' },
        });
        res.json({ success: true, data: activities });
    }
    catch (error) {
        res.status(500).json({ success: false, error: 'Failed to fetch activities' });
    }
};
exports.getActivities = getActivities;
const createActivity = async (req, res) => {
    try {
        let finalPartnerId = req.body.partnerId;
        if (req.body.partnerId === 'NEW') {
            const newPartner = await prisma_1.default.b2BPartner.create({
                data: {
                    company: req.body.newPartnerName,
                    name: req.body.newPartnerName,
                    category: req.body.newPartnerCategory || 'Instansi/Perusahaan',
                    contactName: req.body.newPartnerContactName || null,
                    contactPhone: req.body.newPartnerContactPhone || null,
                }
            });
            finalPartnerId = newPartner.id;
        }
        const activity = await prisma_1.default.b2BActivity.create({
            data: {
                partnerId: finalPartnerId || null,
                method: req.body.method,
                type: req.body.type,
                description: req.body.result ? `[Hasil: ${req.body.result}] ${req.body.description || ''}` : req.body.description,
                picName: req.body.picName,
                targetName: req.body.targetName,
                date: req.body.date ? new Date(req.body.date) : new Date(),
                scheduleId: req.body.scheduleId || null,
            },
        });
        if (req.body.scheduleId) {
            await prisma_1.default.b2BSchedule.update({
                where: { id: req.body.scheduleId },
                data: { status: 'Selesai' }
            });
        }
        if (req.body.result && req.body.result.startsWith('Deal') && finalPartnerId) {
            let transactionType = 'Lainnya';
            let itemName = req.body.itemName || req.body.result;
            if (req.body.result === 'Deal Kerjasama') {
                transactionType = 'Kerjasama';
            }
            else if (req.body.result === 'Deal Pengadaan') {
                transactionType = 'Barang';
            }
            else if (req.body.result === 'Deal Pakai Jasa') {
                transactionType = 'Jasa';
            }
            await prisma_1.default.b2BTransaction.create({
                data: {
                    partnerId: finalPartnerId,
                    picName: req.body.picName,
                    type: transactionType,
                    itemName: itemName,
                    qty: req.body.qty ? parseInt(req.body.qty) : 1,
                    amount: req.body.amount ? parseFloat(req.body.amount) : 0,
                    contractPeriod: req.body.contractPeriod || null,
                    paymentMethod: req.body.paymentMethod || null,
                    paymentDetails: req.body.paymentDetails || null,
                    date: req.body.date ? new Date(req.body.date) : new Date(),
                }
            });
        }
        res.status(201).json({ success: true, data: activity });
    }
    catch (error) {
        res.status(500).json({ success: false, error: 'Failed to create activity' });
    }
};
exports.createActivity = createActivity;
// ─── B2B Schedules ───
const getSchedules = async (req, res) => {
    try {
        const schedules = await prisma_1.default.b2BSchedule.findMany({
            include: {
                partner: { select: { name: true, company: true, category: true } }
            },
            orderBy: { startDate: 'asc' },
        });
        res.json({ success: true, data: schedules });
    }
    catch (error) {
        console.error('Error fetching schedules:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch schedules' });
    }
};
exports.getSchedules = getSchedules;
const createSchedule = async (req, res) => {
    try {
        let finalPartnerId = req.body.partnerId;
        if (req.body.partnerId === 'NEW') {
            const newPartner = await prisma_1.default.b2BPartner.create({
                data: {
                    company: req.body.newPartnerName,
                    name: req.body.newPartnerName,
                    category: req.body.newPartnerCategory || 'Instansi/Perusahaan',
                    contactName: req.body.newPartnerContactName || null,
                    contactPhone: req.body.newPartnerContactPhone || null,
                }
            });
            finalPartnerId = newPartner.id;
        }
        const schedule = await prisma_1.default.b2BSchedule.create({
            data: {
                partnerId: finalPartnerId || null,
                targetName: req.body.targetName,
                title: req.body.title,
                picName: req.body.picName,
                startDate: new Date(req.body.startDate),
                endDate: new Date(req.body.endDate),
                notes: req.body.notes,
                status: 'Belum Visit'
            }
        });
        res.status(201).json({ success: true, data: schedule });
    }
    catch (error) {
        console.error('Error creating schedule:', error);
        res.status(500).json({ success: false, error: 'Failed to create schedule' });
    }
};
exports.createSchedule = createSchedule;
const createBatchSchedules = async (req, res) => {
    try {
        const { schedules } = req.body;
        if (!Array.isArray(schedules)) {
            return res.status(400).json({ success: false, error: 'Schedules must be an array' });
        }
        const createdSchedules = await prisma_1.default.b2BSchedule.createMany({
            data: schedules.map((s) => ({
                partnerId: s.partnerId || null,
                targetName: s.targetName || null,
                title: s.title,
                picName: s.picName,
                startDate: new Date(s.startDate),
                endDate: new Date(s.endDate),
                notes: s.notes || null,
            })),
            skipDuplicates: true,
        });
        res.status(201).json({ success: true, data: createdSchedules });
    }
    catch (error) {
        console.error('Error creating batch schedules:', error);
        res.status(500).json({ success: false, error: 'Failed to create batch schedules' });
    }
};
exports.createBatchSchedules = createBatchSchedules;
// ─── B2B Transactions ───
const getTransactions = async (req, res) => {
    try {
        const { partnerId, month, year } = req.query;
        const where = {};
        if (partnerId)
            where.partnerId = String(partnerId);
        if (month && year) {
            const start = new Date(Number(year), Number(month) - 1, 1);
            const end = new Date(Number(year), Number(month), 0, 23, 59, 59);
            where.date = { gte: start, lte: end };
        }
        else if (req.query.startDate && req.query.endDate) {
            where.date = {
                gte: new Date(req.query.startDate),
                lte: new Date(req.query.endDate),
            };
        }
        const transactions = await prisma_1.default.b2BTransaction.findMany({
            where,
            include: { partner: { select: { name: true, company: true, category: true } } },
            orderBy: { date: 'desc' },
        });
        res.json({ success: true, data: transactions });
    }
    catch (error) {
        res.status(500).json({ success: false, error: 'Failed to fetch transactions' });
    }
};
exports.getTransactions = getTransactions;
const createTransaction = async (req, res) => {
    try {
        let finalPartnerId = req.body.partnerId;
        // Handle auto-creation of partner if 'NEW'
        if (req.body.partnerId === 'NEW') {
            const newPartner = await prisma_1.default.b2BPartner.create({
                data: {
                    company: req.body.newPartnerName,
                    name: req.body.newPartnerName,
                    category: req.body.newPartnerCategory || 'Instansi/Perusahaan',
                    contactName: req.body.newPartnerContactName || null,
                    contactPhone: req.body.newPartnerContactPhone || null,
                }
            });
            finalPartnerId = newPartner.id;
        }
        const transaction = await prisma_1.default.b2BTransaction.create({
            data: {
                partnerId: finalPartnerId,
                picName: req.body.picName,
                type: req.body.type,
                itemName: req.body.itemName,
                qty: Number(req.body.qty) || 1,
                amount: Number(req.body.amount) || 0,
                date: req.body.date ? new Date(req.body.date) : new Date(),
            },
        });
        res.status(201).json({ success: true, data: transaction });
    }
    catch (error) {
        res.status(500).json({ success: false, error: 'Failed to create transaction' });
    }
};
exports.createTransaction = createTransaction;
// ─── B2B Maintenance Logs ───
const getMaintenanceLogs = async (req, res) => {
    try {
        const { partnerId, startDate, endDate, month, year } = req.query;
        const where = {};
        if (partnerId)
            where.partnerId = String(partnerId);
        if (month && year) {
            const start = new Date(Number(year), Number(month) - 1, 1);
            const end = new Date(Number(year), Number(month), 0, 23, 59, 59);
            where.date = { gte: start, lte: end };
        }
        else if (startDate && endDate) {
            where.date = {
                gte: new Date(startDate),
                lte: new Date(endDate),
            };
        }
        const logs = await prisma_1.default.b2BMaintenanceLog.findMany({
            where,
            include: { partner: { select: { name: true, company: true, category: true } } },
            orderBy: { date: 'desc' },
        });
        res.json({ success: true, data: logs });
    }
    catch (error) {
        res.status(500).json({ success: false, error: 'Failed to fetch maintenance logs' });
    }
};
exports.getMaintenanceLogs = getMaintenanceLogs;
const createMaintenanceLog = async (req, res) => {
    try {
        let finalPartnerId = req.body.partnerId;
        if (req.body.partnerId === 'NEW') {
            const newPartner = await prisma_1.default.b2BPartner.create({
                data: {
                    company: req.body.newPartnerName,
                    name: req.body.newPartnerName,
                    category: req.body.newPartnerCategory || 'Instansi/Perusahaan',
                    contactName: req.body.newPartnerContactName || null,
                    contactPhone: req.body.newPartnerContactPhone || null,
                }
            });
            finalPartnerId = newPartner.id;
        }
        const log = await prisma_1.default.b2BMaintenanceLog.create({
            data: {
                partnerId: finalPartnerId,
                activity: req.body.activity,
                description: req.body.description,
                date: req.body.date ? new Date(req.body.date) : new Date(),
            },
        });
        res.status(201).json({ success: true, data: log });
    }
    catch (error) {
        res.status(500).json({ success: false, error: 'Failed to create maintenance log' });
    }
};
exports.createMaintenanceLog = createMaintenanceLog;
// ─── B2B Dashboard Metrics ───
const getB2BMetrics = async (req, res) => {
    try {
        const { month, year, startDate, endDate } = req.query;
        let start;
        let end;
        let prevStart;
        let prevEnd;
        if (startDate && endDate) {
            start = new Date(startDate);
            end = new Date(endDate);
            const diffTime = Math.abs(end.getTime() - start.getTime());
            prevStart = new Date(start.getTime() - diffTime - (24 * 60 * 60 * 1000));
            prevEnd = new Date(start.getTime() - (24 * 60 * 60 * 1000));
        }
        else {
            const m = Number(month) || new Date().getMonth() + 1;
            const y = Number(year) || new Date().getFullYear();
            start = new Date(y, m - 1, 1);
            end = new Date(y, m, 0, 23, 59, 59);
            let prevM = m - 1;
            let prevY = y;
            if (prevM === 0) {
                prevM = 12;
                prevY = y - 1;
            }
            prevStart = new Date(prevY, prevM - 1, 1);
            prevEnd = new Date(prevY, prevM, 0, 23, 59, 59);
        }
        const [totalPartners, activePartners, transactions, prevTransactions, newPartnersThisMonth, activities, prevActivities] = await Promise.all([
            prisma_1.default.b2BPartner.count(),
            prisma_1.default.b2BPartner.count({ where: { status: 'Active' } }),
            prisma_1.default.b2BTransaction.findMany({ where: { date: { gte: start, lte: end } } }),
            prisma_1.default.b2BTransaction.findMany({ where: { date: { gte: prevStart, lte: prevEnd } } }),
            prisma_1.default.b2BPartner.count({ where: { startDate: { gte: start, lte: end } } }),
            prisma_1.default.b2BActivity.count({ where: { date: { gte: start, lte: end } } }),
            prisma_1.default.b2BActivity.count({ where: { date: { gte: prevStart, lte: prevEnd } } })
        ]);
        const omzetB2B = transactions.reduce((s, a) => s + a.amount, 0);
        const prevOmzet = prevTransactions.reduce((s, a) => s + a.amount, 0);
        const omzetTrend = prevOmzet === 0 ? (omzetB2B > 0 ? 100 : 0) : ((omzetB2B - prevOmzet) / prevOmzet) * 100;
        const totalActivities = activities;
        const activitiesTrend = prevActivities === 0 ? (totalActivities > 0 ? 100 : 0) : ((totalActivities - prevActivities) / prevActivities) * 100;
        res.json({
            success: true,
            data: {
                omzetB2B,
                omzetTrend,
                totalActivities,
                activitiesTrend,
                newPartnersThisMonth,
                activePartners,
                totalPartners
            },
        });
    }
    catch (error) {
        res.status(500).json({ success: false, error: 'Failed' });
    }
};
exports.getB2BMetrics = getB2BMetrics;
//# sourceMappingURL=b2b.controller.js.map