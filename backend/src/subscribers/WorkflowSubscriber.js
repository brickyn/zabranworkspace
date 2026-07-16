"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerWorkflowSubscribers = registerWorkflowSubscribers;
const EventBus_1 = require("../services/EventBus");
const events_1 = require("../types/events");
const logger_1 = __importDefault(require("../utils/logger"));
function registerWorkflowSubscribers() {
    EventBus_1.EventBus.subscribe(events_1.DomainEvents.WorkflowTransitioned, async (payload) => {
        logger_1.default.info(`[WorkflowSubscriber] Processing transition for ${payload.entityType}:${payload.entityId}`);
        const actions = payload.payload?.actions || [];
        // Simulate Action Dispatcher that was previously in WorkflowEngine
        for (const action of actions) {
            switch (action) {
                case 'RESERVE_INVENTORY':
                    logger_1.default.info(`[Action Executed] RESERVE_INVENTORY for ${payload.entityId}`);
                    // Will be connected to Inventory Service logic
                    break;
                case 'NOTIFY_MANAGER':
                    logger_1.default.info(`[Action Executed] NOTIFY_MANAGER for ${payload.entityId}`);
                    // Send push notification or email
                    break;
                case 'RELEASE_INVENTORY':
                    logger_1.default.info(`[Action Executed] RELEASE_INVENTORY for ${payload.entityId}`);
                    break;
                case 'UPDATE_STOCK':
                    logger_1.default.info(`[Action Executed] UPDATE_STOCK for ${payload.entityId}`);
                    break;
                case 'NOTIFY_WAREHOUSE':
                    logger_1.default.info(`[Action Executed] NOTIFY_WAREHOUSE for ${payload.entityId}`);
                    break;
                case 'UPDATE_LOGISTICS':
                    logger_1.default.info(`[Action Executed] UPDATE_LOGISTICS for ${payload.entityId}`);
                    break;
                default:
                    logger_1.default.warn(`[WorkflowSubscriber] Unknown workflow action: ${action}`);
            }
        }
    });
}
//# sourceMappingURL=WorkflowSubscriber.js.map