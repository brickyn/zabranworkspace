import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { WorkflowEngine } from '../services/WorkflowEngine';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/AppError';

const prisma = new PrismaClient();

export const createWorkflow = catchAsync(async (req: Request, res: Response) => {
  const { name, module, description, version } = req.body;
  const workflow = await prisma.workflowDefinition.create({
    data: {
      name,
      module,
      description,
      version,
      createdBy: (req as any).user.id
    }
  });
  res.status(201).json(workflow);
});

export const addState = catchAsync(async (req: Request, res: Response) => {
  const { workflowId } = req.params;
  const { name, type } = req.body;
  const state = await prisma.workflowState.create({
    data: {
      workflowId: String(workflowId),
      name,
      type
    }
  });
  res.status(201).json(state);
});

export const addTransition = catchAsync(async (req: Request, res: Response) => {
  const { workflowId } = req.params;
  const { fromStateId, toStateId, conditions, actions, requiredRole, requiredPermission } = req.body;
  
  const transition = await prisma.workflowTransition.create({
    data: {
      workflowId: String(workflowId),
      fromStateId,
      toStateId,
      conditions,
      actions,
      requiredRole,
      requiredPermission
    }
  });
  res.status(201).json(transition);
});

export const getWorkflowHistory = catchAsync(async (req: Request, res: Response) => {
  const { instanceId } = req.params;
  const history = await prisma.workflowHistory.findMany({
    where: { instanceId: String(instanceId) },
    orderBy: { createdAt: 'desc' },
    include: {
      instance: {
        include: {
          currentState: true,
          workflow: true
        }
      }
    }
  });
  res.json(history);
});

export const getAvailableTransitions = catchAsync(async (req: Request, res: Response) => {
  const instanceId = req.params.instanceId as string;
  const user = (req as any).user;
  
  const transitions = await WorkflowEngine.getAvailableTransitions(
    instanceId,
    user.id,
    user.role,
    user.permissions || []
  );
  
  res.json(transitions);
});

export const executeTransition = catchAsync(async (req: Request, res: Response) => {
  const instanceId = req.params.instanceId as string;
  const { toStateName, comment, contextUpdates } = req.body;
  const user = (req as any).user;

  const result = await WorkflowEngine.executeTransition(
    instanceId,
    toStateName,
    user.id,
    user.role,
    user.permissions || [],
    comment,
    contextUpdates
  );

  res.json(result);
});
