"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCustomer = exports.updateCustomer = exports.createCustomer = exports.getCustomerById = exports.getCustomers = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const getCustomers = async (req, res) => {
    try {
        const { search } = req.query;
        let whereClause = { deletedAt: null };
        if (search) {
            whereClause.OR = [
                { name: { contains: String(search), mode: 'insensitive' } },
                { phone: { contains: String(search) } },
                { email: { contains: String(search), mode: 'insensitive' } }
            ];
        }
        const customers = await prisma_1.default.customer.findMany({
            where: whereClause,
            orderBy: { createdAt: 'desc' },
            include: {
                _count: {
                    select: { transactions: true }
                }
            }
        });
        res.json({ success: true, data: customers });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Failed to fetch customers' });
    }
};
exports.getCustomers = getCustomers;
const getCustomerById = async (req, res) => {
    try {
        const id = String(req.params.id);
        const customer = await prisma_1.default.customer.findUnique({
            where: { id: id },
            include: {
                transactions: {
                    orderBy: { createdAt: 'desc' },
                    take: 10
                }
            }
        });
        if (!customer) {
            res.status(404).json({ success: false, error: 'Customer not found' });
            return;
        }
        res.json({ success: true, data: customer });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Failed to fetch customer' });
    }
};
exports.getCustomerById = getCustomerById;
const createCustomer = async (req, res) => {
    try {
        const { name, phone, email } = req.body;
        if (!name) {
            res.status(400).json({ success: false, error: 'Name is required' });
            return;
        }
        const customer = await prisma_1.default.customer.create({
            data: {
                name,
                phone: phone || null,
                email: email || null,
                points: 0
            }
        });
        res.status(201).json({ success: true, data: customer });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Failed to create customer' });
    }
};
exports.createCustomer = createCustomer;
const updateCustomer = async (req, res) => {
    try {
        const id = String(req.params.id);
        const { name, phone, email, points } = req.body;
        const customer = await prisma_1.default.customer.update({
            where: { id: id },
            data: {
                name,
                phone,
                email,
                points: points !== undefined ? Number(points) : undefined
            }
        });
        res.json({ success: true, data: customer });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Failed to update customer' });
    }
};
exports.updateCustomer = updateCustomer;
const deleteCustomer = async (req, res) => {
    try {
        const id = String(req.params.id);
        const customer = await prisma_1.default.customer.findFirst({
            where: { id, deletedAt: null },
            include: { _count: { select: { transactions: true } } }
        });
        if (!customer) {
            res.status(404).json({ success: false, error: 'Customer not found' });
            return;
        }
        if (customer._count.transactions > 0) {
            // Soft delete: can't hard delete customers with transactions for data integrity
            await prisma_1.default.customer.update({
                where: { id: id },
                data: { deletedAt: new Date() }
            });
            res.json({ success: true, message: 'Customer archived (has transaction history)' });
            return;
        }
        await prisma_1.default.customer.delete({ where: { id } });
        res.json({ success: true, message: 'Customer deleted successfully' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Failed to delete customer' });
    }
};
exports.deleteCustomer = deleteCustomer;
//# sourceMappingURL=customer.controller.js.map