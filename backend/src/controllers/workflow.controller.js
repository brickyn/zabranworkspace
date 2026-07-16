"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeTransition = exports.getAvailableTransitions = exports.getWorkflowHistory = exports.addTransition = exports.addState = exports.createWorkflow = void 0;
const client_1 = require("@prisma/client");
const WorkflowEngine_1 = require("../services/WorkflowEngine");
const catchAsync_1 = require("../utils/catchAsync");
const prisma = new client_1.PrismaClient();
exports.createWorkflow = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { name, module, description, version } = req.body;
    const workflow = await prisma.workflowDefinition.create({
        data: {
            name,
            module,
            description,
            version,
            createdBy: req.user.id
        }
    });
    res.status(201).json(workflow);
});
exports.addState = (0, catchAsync_1.catchAsync)(async (req, res) => {
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
exports.addTransition = (0, catchAsync_1.catchAsync)(async (req, res) => {
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
exports.getWorkflowHistory = (0, catchAsync_1.catchAsync)(async (req, res) => {
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
exports.getAvailableTransitions = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const instanceId = req.params.instanceId;
    const user = req.user;
    const transitions = await WorkflowEngine_1.WorkflowEngine.getAvailableTransitions(instanceId, user.id, user.role, user.permissions || []);
    res.json(transitions);
});
exports.executeTransition = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const instanceId = req.params.instanceId;
    const { toStateName, comment, contextUpdates } = req.body;
    const user = req.user;
    const result = await WorkflowEngine_1.WorkflowEngine.executeTransition(instanceId, toStateName, user.id, user.role, user.permissions || [], comment, contextUpdates);
    res.json(result);
});
//# sourceMappingURL=workflow.controller.js.map