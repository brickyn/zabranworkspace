"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.evaluateRuleTest = exports.getEvaluationHistory = exports.getRules = exports.updateRule = exports.createRule = void 0;
const client_1 = require("@prisma/client");
const RuleEngine_1 = require("../services/RuleEngine");
const catchAsync_1 = require("../utils/catchAsync");
const prisma = new client_1.PrismaClient();
exports.createRule = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { name, description, module, category, priority, stopProcessing, conditions, actions, expirationDate } = req.body;
    const user = req.user;
    const rule = await prisma.businessRule.create({
        data: {
            name,
            description,
            module,
            category,
            priority: priority || 0,
            stopProcessing: stopProcessing || false,
            conditions,
            actions,
            expirationDate: expirationDate ? new Date(expirationDate) : null,
            createdBy: user.id
        }
    });
    res.status(201).json(rule);
});
exports.updateRule = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const ruleId = req.params.ruleId;
    const data = req.body;
    const rule = await prisma.businessRule.update({
        where: { id: ruleId },
        data
    });
    res.json(rule);
});
exports.getRules = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const module = req.query.module;
    const category = req.query.category;
    const where = {};
    if (module)
        where.module = String(module);
    if (category)
        where.category = String(category);
    const rules = await prisma.businessRule.findMany({
        where,
        orderBy: { priority: 'desc' }
    });
    res.json(rules);
});
exports.getEvaluationHistory = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const ruleId = req.query.ruleId;
    const entityId = req.query.entityId;
    const where = {};
    if (ruleId)
        where.ruleId = String(ruleId);
    if (entityId)
        where.entityId = String(entityId);
    const history = await prisma.ruleEvaluationHistory.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 100
    });
    res.json(history);
});
exports.evaluateRuleTest = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { module, category, inputPayload, entityType, entityId } = req.body;
    const user = req.user;
    const result = await RuleEngine_1.RuleEngine.evaluate(module, category, inputPayload, entityType, entityId, user.id);
    res.json(result);
});
//# sourceMappingURL=rule.controller.js.map