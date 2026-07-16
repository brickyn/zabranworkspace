import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { RuleEngine } from '../services/RuleEngine';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/AppError';

const prisma = new PrismaClient();

export const createRule = catchAsync(async (req: Request, res: Response) => {
  const { name, description, module, category, priority, stopProcessing, conditions, actions, expirationDate } = req.body;
  const user = (req as any).user;

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

export const updateRule = catchAsync(async (req: Request, res: Response) => {
  const { ruleId } = req.params;
  const data = req.body;
  
  const rule = await prisma.businessRule.update({
    where: { id: ruleId },
    data
  });
  
  res.json(rule);
});

export const getRules = catchAsync(async (req: Request, res: Response) => {
  const { module, category } = req.query;
  const where: any = {};
  if (module) where.module = String(module);
  if (category) where.category = String(category);
  
  const rules = await prisma.businessRule.findMany({
    where,
    orderBy: { priority: 'desc' }
  });
  
  res.json(rules);
});

export const getEvaluationHistory = catchAsync(async (req: Request, res: Response) => {
  const { ruleId, entityId } = req.query;
  const where: any = {};
  if (ruleId) where.ruleId = String(ruleId);
  if (entityId) where.entityId = String(entityId);
  
  const history = await prisma.ruleEvaluationHistory.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 100
  });
  
  res.json(history);
});

export const evaluateRuleTest = catchAsync(async (req: Request, res: Response) => {
  const { module, category, inputPayload, entityType, entityId } = req.body;
  const user = (req as any).user;

  const result = await RuleEngine.evaluate(
    module,
    category,
    inputPayload,
    entityType,
    entityId,
    user.id
  );

  res.json(result);
});
