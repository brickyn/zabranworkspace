import { PrismaClient, WorkflowState, WorkflowInstance } from '@prisma/client';
import logger from '../utils/logger';
import { AppError } from '../utils/AppError';
import { EventBus } from './EventBus';
import { DomainEvents } from '../types/events';

const prisma = new PrismaClient();

export class WorkflowEngine {
  
  /**
   * Initialize a new workflow instance for an entity
   */
  static async initializeInstance(
    workflowName: string, 
    entityType: string, 
    entityId: string, 
    contextData: any = {}, 
    userId?: string
  ): Promise<WorkflowInstance> {
    const workflow = await prisma.workflowDefinition.findUnique({
      where: { name: workflowName },
      include: { states: true }
    });

    if (!workflow || !workflow.isActive) {
      throw new AppError(`Workflow ${workflowName} is not found or inactive`, 404);
    }

    const initialState = workflow.states.find(s => s.type === 'INITIAL');
    if (!initialState) {
      throw new AppError(`Workflow ${workflowName} has no INITIAL state`, 400);
    }

    return await prisma.$transaction(async (tx) => {
      const instance = await tx.workflowInstance.create({
        data: {
          workflowId: workflow.id,
          entityType,
          entityId,
          currentStateId: initialState.id,
          contextData
        }
      });

      await tx.workflowHistory.create({
        data: {
          instanceId: instance.id,
          toStateId: initialState.id,
          actionBy: userId,
          comment: 'Workflow Initialized',
          reason: 'System initialization'
        }
      });

      return instance;
    });
  }

  /**
   * Get available transitions for a specific workflow instance
   */
  static async getAvailableTransitions(instanceId: string, userId: string, userRole: string, userPermissions: string[]) {
    const instance = await prisma.workflowInstance.findUnique({
      where: { id: instanceId },
      include: { 
        currentState: {
          include: {
            transitionsFrom: {
              include: { toState: true }
            }
          }
        }
      }
    });

    if (!instance) throw new AppError('Workflow instance not found', 404);

    const available = [];
    for (const transition of instance.currentState.transitionsFrom) {
      let allowed = true;
      
      // RBAC Check
      if (transition.requiredRole && transition.requiredRole !== userRole) allowed = false;
      if (transition.requiredPermission && !userPermissions.includes(transition.requiredPermission)) allowed = false;
      
      // Note: Future addition -> check RoleDelegation if requireDelegation is true and RBAC fails
      
      // Condition Check (Rules Engine)
      if (allowed && transition.conditions) {
        allowed = this.evaluateConditions(transition.conditions, instance.contextData);
      }

      if (allowed) available.push(transition);
    }

    return available;
  }

  /**
   * Execute a state transition
   */
  static async executeTransition(
    instanceId: string, 
    toStateName: string, 
    userId: string, 
    userRole: string,
    userPermissions: string[],
    comment?: string,
    contextUpdates?: any
  ) {
    const instance = await prisma.workflowInstance.findUnique({
      where: { id: instanceId },
      include: { 
        workflow: true,
        currentState: {
          include: {
            transitionsFrom: {
              include: { toState: true }
            }
          }
        },
        history: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });

    if (!instance) throw new AppError('Workflow instance not found', 404);

    // Find requested transition
    const transition = instance.currentState.transitionsFrom.find(t => t.toState.name === toStateName);
    if (!transition) {
      throw new AppError(`Invalid transition from ${instance.currentState.name} to ${toStateName}`, 400);
    }

    // Authorize
    if (transition.requiredRole && transition.requiredRole !== userRole) {
      throw new AppError(`Role ${transition.requiredRole} required for this transition`, 403);
    }
    if (transition.requiredPermission && !userPermissions.includes(transition.requiredPermission)) {
      throw new AppError(`Permission ${transition.requiredPermission} required`, 403);
    }

    // Evaluate Conditions
    const mergedContext = { ...(instance.contextData as object), ...contextUpdates };
    if (transition.conditions) {
      if (!this.evaluateConditions(transition.conditions, mergedContext)) {
        throw new AppError(`Conditions not met for transition to ${toStateName}`, 400);
      }
    }

    // Execute Transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Update Instance State
      const updatedInstance = await tx.workflowInstance.update({
        where: { id: instanceId },
        data: {
          currentStateId: transition.toStateId,
          contextData: mergedContext
        }
      });

      // 2. Calculate duration
      const lastHistory = instance.history[0];
      const durationMs = lastHistory ? new Date().getTime() - lastHistory.createdAt.getTime() : 0;

      // 3. Log History
      await tx.workflowHistory.create({
        data: {
          instanceId: instanceId,
          fromStateId: instance.currentStateId,
          toStateId: transition.toStateId,
          actionBy: userId,
          comment,
          durationMs
        }
      });

      // 4. Trigger Actions via EventBus
      if (transition.actions && Array.isArray(transition.actions) && transition.actions.length > 0) {
        // Publish event asynchronously so it doesn't block the transaction
        process.nextTick(() => {
          EventBus.publish({
            eventName: DomainEvents.WorkflowTransitioned,
            sourceModule: 'WORKFLOW',
            entityType: updatedInstance.entityType,
            entityId: updatedInstance.entityId,
            triggeredBy: userId,
            payload: {
              fromState: instance.currentState.name,
              toState: transition.toState.name,
              actions: transition.actions,
              contextData: mergedContext
            }
          });
        });
      }

      return updatedInstance;
    });

    logger.info(`Workflow ${instance.workflow.name} [${instance.entityType}:${instance.entityId}] transitioned to ${toStateName}`);
    return result;
  }

  /**
   * Simple Rule Evaluator
   * Expects conditions format: { rules: [{ field: 'amount', operator: '>', value: 1000 }] }
   */
  private static evaluateConditions(conditions: any, context: any): boolean {
    if (!conditions || !conditions.rules || !Array.isArray(conditions.rules)) return true;

    for (const rule of conditions.rules) {
      const actualValue = context ? context[rule.field] : undefined;
      if (actualValue === undefined) return false;

      switch (rule.operator) {
        case '>': if (!(actualValue > rule.value)) return false; break;
        case '<': if (!(actualValue < rule.value)) return false; break;
        case '>=': if (!(actualValue >= rule.value)) return false; break;
        case '<=': if (!(actualValue <= rule.value)) return false; break;
        case '==': if (actualValue != rule.value) return false; break;
        case '!=': if (actualValue != rule.value) return false; break;
        default: return false; // Unknown operator
      }
    }
    return true;
  }

  // executeActions method removed, logic delegated to EventBus subscribers

}
