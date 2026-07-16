import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { MetadataEngine } from '../services/MetadataEngine';
import { catchAsync } from '../utils/catchAsync';
import { EventBus } from '../services/EventBus';

const prisma = new PrismaClient();

// ─── FIELD DEFINITIONS ───

export const createField = catchAsync(async (req: Request, res: Response) => {
  const data = req.body;
  const field = await prisma.customFieldDefinition.create({ data });
  
  EventBus.publish({
    eventName: 'MetadataSchemaChanged',
    sourceModule: 'METADATA',
    entityType: field.entityType,
    entityId: 'schema',
    payload: { action: 'CREATED', fieldId: field.id }
  });

  res.status(201).json(field);
});

export const updateField = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const data = req.body;
  const field = await prisma.customFieldDefinition.update({ where: { id }, data });
  
  EventBus.publish({
    eventName: 'MetadataSchemaChanged',
    sourceModule: 'METADATA',
    entityType: field.entityType,
    entityId: 'schema',
    payload: { action: 'UPDATED', fieldId: field.id }
  });

  res.json(field);
});

export const getFields = catchAsync(async (req: Request, res: Response) => {
  const entityType = req.query.entityType as string | undefined;
  const module = req.query.module as string | undefined;
  const where: any = {};
  if (entityType) where.entityType = String(entityType);
  if (module) where.module = String(module);

  const fields = await prisma.customFieldDefinition.findMany({
    where,
    orderBy: { order: 'asc' }
  });
  res.json(fields);
});

// ─── DATA VALUES ───

export const getEntityData = catchAsync(async (req: Request, res: Response) => {
  const entityType = req.params.entityType as string;
  const entityId = req.params.entityId as string;
  const data = await MetadataEngine.getData(entityType, entityId);
  res.json(data);
});

export const saveEntityData = catchAsync(async (req: Request, res: Response) => {
  const entityType = req.params.entityType as string;
  const entityId = req.params.entityId as string;
  const payload = req.body; // { warranty_months: 12, ... }
  
  const saved = await MetadataEngine.validateAndSaveData(entityType, entityId, payload);
  res.json(saved);
});
