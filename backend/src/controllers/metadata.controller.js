"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveEntityData = exports.getEntityData = exports.getFields = exports.updateField = exports.createField = void 0;
const client_1 = require("@prisma/client");
const MetadataEngine_1 = require("../services/MetadataEngine");
const catchAsync_1 = require("../utils/catchAsync");
const EventBus_1 = require("../services/EventBus");
const prisma = new client_1.PrismaClient();
// ─── FIELD DEFINITIONS ───
exports.createField = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const data = req.body;
    const field = await prisma.customFieldDefinition.create({ data });
    EventBus_1.EventBus.publish({
        eventName: 'MetadataSchemaChanged',
        sourceModule: 'METADATA',
        entityType: field.entityType,
        entityId: 'schema',
        payload: { action: 'CREATED', fieldId: field.id }
    });
    res.status(201).json(field);
});
exports.updateField = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const id = req.params.id;
    const data = req.body;
    const field = await prisma.customFieldDefinition.update({ where: { id }, data });
    EventBus_1.EventBus.publish({
        eventName: 'MetadataSchemaChanged',
        sourceModule: 'METADATA',
        entityType: field.entityType,
        entityId: 'schema',
        payload: { action: 'UPDATED', fieldId: field.id }
    });
    res.json(field);
});
exports.getFields = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const entityType = req.query.entityType;
    const module = req.query.module;
    const where = {};
    if (entityType)
        where.entityType = String(entityType);
    if (module)
        where.module = String(module);
    const fields = await prisma.customFieldDefinition.findMany({
        where,
        orderBy: { order: 'asc' }
    });
    res.json(fields);
});
// ─── DATA VALUES ───
exports.getEntityData = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const entityType = req.params.entityType;
    const entityId = req.params.entityId;
    const data = await MetadataEngine_1.MetadataEngine.getData(entityType, entityId);
    res.json(data);
});
exports.saveEntityData = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const entityType = req.params.entityType;
    const entityId = req.params.entityId;
    const payload = req.body; // { warranty_months: 12, ... }
    const saved = await MetadataEngine_1.MetadataEngine.validateAndSaveData(entityType, entityId, payload);
    res.json(saved);
});
//# sourceMappingURL=metadata.controller.js.map