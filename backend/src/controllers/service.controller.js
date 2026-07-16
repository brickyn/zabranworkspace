"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateServiceJobStatus = exports.createServiceJob = exports.getServiceJobs = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const getServiceJobs = async (req, res) => {
    try {
        const { branchId, status } = req.query;
        const where = {};
        if (branchId && branchId !== 'all')
            where.branchId = branchId;
        if (status && status !== 'all')
            where.status = status;
        const jobs = await prisma_1.default.serviceJob.findMany({
            where,
            include: { branch: true },
            orderBy: { createdAt: 'desc' }
        });
        res.json({ success: true, data: jobs });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Failed to fetch service jobs' });
    }
};
exports.getServiceJobs = getServiceJobs;
const createServiceJob = async (req, res) => {
    try {
        const { branchId, customerName, customerPhone, deviceModel, issues, estimatedCost, downPayment, notes } = req.body;
        if (!branchId || !customerName || !deviceModel || !issues) {
            res.status(400).json({ success: false, error: 'Missing required fields' });
            return;
        }
        const job = await prisma_1.default.serviceJob.create({
            data: {
                branchId,
                customerName,
                customerPhone,
                deviceModel,
                issues,
                estimatedCost: Number(estimatedCost || 0),
                downPayment: Number(downPayment || 0),
                notes,
                status: 'Antrean'
            }
        });
        res.status(201).json({ success: true, data: job });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Failed to create service job' });
    }
};
exports.createServiceJob = createServiceJob;
const updateServiceJobStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, notes } = req.body;
        const data = {};
        if (status)
            data.status = status;
        if (notes)
            data.notes = notes;
        if (status === 'Selesai' || status === 'Diambil') {
            data.completionDate = new Date();
        }
        const job = await prisma_1.default.serviceJob.update({
            where: { id: String(id) },
            data
        });
        res.json({ success: true, data: job });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Failed to update service job' });
    }
};
exports.updateServiceJobStatus = updateServiceJobStatus;
//# sourceMappingURL=service.controller.js.map