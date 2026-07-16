"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RuleEngine = exports.RuleEngineService = void 0;
const client_1 = require("@prisma/client");
const logger_1 = __importDefault(require("../utils/logger"));
const EventBus_1 = require("./EventBus");
const events_1 = require("../types/events");
const prisma = new client_1.PrismaClient();
class RuleEngineService {
    /**
     * Evaluates business rules for a specific module and category.
     * @param module e.g., 'POS', 'INVENTORY'
     * @param category e.g., 'DISCOUNT', 'APPROVAL'
     * @param inputPayload Data to be evaluated (e.g., { role: 'Cashier', amount: 500000 })
     * @param entityType (Optional) For audit log
     * @param entityId (Optional) For audit log
     * @param triggeredBy (Optional) User ID triggering the evaluation
     */
    async evaluate(module, category, inputPayload, entityType = 'Unknown', entityId, triggeredBy) {
        const startTime = Date.now();
        const result = { isMatch: false, actions: [], matchedRules: [] };
        try {
            // 1. Fetch active rules
            const rules = await prisma.businessRule.findMany({
                where: {
                    module,
                    category,
                    isActive: true,
                    effectiveDate: { lte: new Date() },
                    OR: [
                        { expirationDate: null },
                        { expirationDate: { gt: new Date() } }
                    ]
                },
                orderBy: { priority: 'desc' } // Higher priority first
            });
            // 2. Evaluate rules
            for (const rule of rules) {
                const isMatch = this.evaluateConditionNode(rule.conditions, inputPayload);
                // 3. Log Evaluation
                await prisma.ruleEvaluationHistory.create({
                    data: {
                        ruleId: rule.id,
                        ruleName: rule.name,
                        entityType,
                        entityId,
                        inputPayload,
                        isMatch,
                        executedActions: isMatch ? rule.actions : null,
                        triggeredBy,
                        durationMs: Date.now() - startTime
                    }
                });
                if (isMatch) {
                    result.isMatch = true;
                    result.matchedRules.push(rule.name);
                    const actions = Array.isArray(rule.actions) ? rule.actions : [rule.actions];
                    result.actions.push(...actions);
                    // If stopProcessing is true, break the loop (ignore lower priority rules)
                    if (rule.stopProcessing) {
                        break;
                    }
                }
            }
            // 4. Trigger Publish Events if any action requires it
            for (const action of result.actions) {
                if (action.type === 'PUBLISH_EVENT') {
                    EventBus_1.EventBus.publish({
                        eventName: action.payload?.eventName || events_1.DomainEvents.WorkflowActionRequested,
                        sourceModule: module,
                        entityType,
                        entityId: entityId || 'unknown',
                        triggeredBy,
                        payload: action.payload
                    });
                }
            }
            return result;
        }
        catch (error) {
            logger_1.default.error(`[RuleEngine] Evaluation failed for ${module}:${category}`, error);
            throw error;
        }
    }
    /**
     * Evaluates a DSL condition node.
     * Format: { operator: 'AND', rules: [{ field: 'qty', operator: '>', value: 10 }] }
     */
    evaluateConditionNode(node, context) {
        if (!node || typeof node !== 'object')
            return true;
        // Handle simple rule: { field: '...', operator: '...', value: '...' }
        if (node.field && node.operator) {
            return this.evaluateSimpleRule(node, context);
        }
        // Handle grouping: { operator: 'AND' | 'OR', rules: [...] }
        if (node.operator && Array.isArray(node.rules)) {
            if (node.operator === 'AND') {
                return node.rules.every((r) => this.evaluateConditionNode(r, context));
            }
            if (node.operator === 'OR') {
                return node.rules.some((r) => this.evaluateConditionNode(r, context));
            }
        }
        return false;
    }
    evaluateSimpleRule(rule, context) {
        const { field, operator, value } = rule;
        const actualValue = context ? context[field] : undefined;
        if (actualValue === undefined)
            return false;
        switch (operator) {
            case '==':
            case '===':
                return actualValue === value;
            case '!=':
            case '!==':
                return actualValue !== value;
            case '>':
                return actualValue > value;
            case '>=':
                return actualValue >= value;
            case '<':
                return actualValue < value;
            case '<=':
                return actualValue <= value;
            case 'IN':
                return Array.isArray(value) && value.includes(actualValue);
            case 'NOT_IN':
                return Array.isArray(value) && !value.includes(actualValue);
            case 'CONTAINS':
                return typeof actualValue === 'string' && actualValue.includes(value);
            default:
                logger_1.default.warn(`[RuleEngine] Unknown operator: ${operator}`);
                return false;
        }
    }
}
exports.RuleEngineService = RuleEngineService;
exports.RuleEngine = new RuleEngineService();
//# sourceMappingURL=RuleEngine.js.map