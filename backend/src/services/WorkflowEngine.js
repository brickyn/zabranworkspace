"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowEngine = void 0;
const client_1 = require("@prisma/client");
const logger_1 = __importDefault(require("../utils/logger"));
const AppError_1 = require("../utils/AppError");
const EventBus_1 = require("./EventBus");
const events_1 = require("../types/events");
const prisma = new client_1.PrismaClient();
class WorkflowEngine {
    /**
     * Initialize a new workflow instance for an entity
     */
    static async initializeInstance(workflowName, entityType, entityId, contextData = {}, userId) {
        const workflow = await prisma.workflowDefinition.findUnique({
            where: { name: workflowName },
            include: { states: true }
        });
        if (!workflow || !workflow.isActive) {
            throw new AppError_1.AppError(`Workflow ${workflowName} is not found or inactive`, 404);
        }
        const initialState = workflow.states.find(s => s.type === 'INITIAL');
        if (!initialState) {
            throw new AppError_1.AppError(`Workflow ${workflowName} has no INITIAL state`, 400);
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
    static async getAvailableTransitions(instanceId, userId, userRole, userPermissions) {
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
        if (!instance)
            throw new AppError_1.AppError('Workflow instance not found', 404);
        const available = [];
        for (const transition of instance.currentState.transitionsFrom) {
            let allowed = true;
            // RBAC Check
            if (transition.requiredRole && transition.requiredRole !== userRole)
                allowed = false;
            if (transition.requiredPermission && !userPermissions.includes(transition.requiredPermission))
                allowed = false;
            // Note: Future addition -> check RoleDelegation if requireDelegation is true and RBAC fails
            // Condition Check (Rules Engine)
            if (allowed && transition.conditions) {
                allowed = this.evaluateConditions(transition.conditions, instance.contextData);
            }
            if (allowed)
                available.push(transition);
        }
        return available;
    }
    /**
     * Execute a state transition
     */
    static async executeTransition(instanceId, toStateName, userId, userRole, userPermissions, comment, contextUpdates) {
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
        if (!instance)
            throw new AppError_1.AppError('Workflow instance not found', 404);
        // Find requested transition
        const transition = instance.currentState.transitionsFrom.find(t => t.toState.name === toStateName);
        if (!transition) {
            throw new AppError_1.AppError(`Invalid transition from ${instance.currentState.name} to ${toStateName}`, 400);
        }
        // Authorize
        if (transition.requiredRole && transition.requiredRole !== userRole) {
            throw new AppError_1.AppError(`Role ${transition.requiredRole} required for this transition`, 403);
        }
        if (transition.requiredPermission && !userPermissions.includes(transition.requiredPermission)) {
            throw new AppError_1.AppError(`Permission ${transition.requiredPermission} required`, 403);
        }
        // Evaluate Conditions
        const mergedContext = { ...instance.contextData, ...contextUpdates };
        if (transition.conditions) {
            if (!this.evaluateConditions(transition.conditions, mergedContext)) {
                throw new AppError_1.AppError(`Conditions not met for transition to ${toStateName}`, 400);
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
                    EventBus_1.EventBus.publish({
                        eventName: events_1.DomainEvents.WorkflowTransitioned,
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
        logger_1.default.info(`Workflow ${instance.workflow.name} [${instance.entityType}:${instance.entityId}] transitioned to ${toStateName}`);
        return result;
    }
    /**
     * Simple Rule Evaluator
     * Expects conditions format: { rules: [{ field: 'amount', operator: '>', value: 1000 }] }
     */
    static evaluateConditions(conditions, context) {
        if (!conditions || !conditions.rules || !Array.isArray(conditions.rules))
            return true;
        for (const rule of conditions.rules) {
            const actualValue = context ? context[rule.field] : undefined;
            if (actualValue === undefined)
                return false;
            switch (rule.operator) {
                case '>':
                    if (!(actualValue > rule.value))
                        return false;
                    break;
                case '<':
                    if (!(actualValue < rule.value))
                        return false;
                    break;
                case '>=':
                    if (!(actualValue >= rule.value))
                        return false;
                    break;
                case '<=':
                    if (!(actualValue <= rule.value))
                        return false;
                    break;
                case '==':
                    if (actualValue != rule.value)
                        return false;
                    break;
                case '!=':
                    if (actualValue != rule.value)
                        return false;
                    break;
                default: return false; // Unknown operator
            }
        }
        return true;
    }
}
exports.WorkflowEngine = WorkflowEngine;
//# sourceMappingURL=WorkflowEngine.js.map