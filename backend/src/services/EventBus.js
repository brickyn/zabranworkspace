"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventBus = void 0;
const events_1 = require("events");
const client_1 = require("@prisma/client");
const logger_1 = __importDefault(require("../utils/logger"));
const prisma = new client_1.PrismaClient();
class EventBusService extends events_1.EventEmitter {
    constructor() {
        super();
        // Allow unlimited listeners or set to a higher limit
        this.setMaxListeners(50);
    }
    /**
     * Publish an event to the Event Bus
     */
    async publish(event) {
        try {
            // 1. Persist to Audit Log as PENDING
            const log = await prisma.eventBusLog.create({
                data: {
                    eventName: event.eventName,
                    sourceModule: event.sourceModule,
                    entityType: event.entityType,
                    entityId: event.entityId,
                    branchId: event.branchId,
                    triggeredBy: event.triggeredBy,
                    correlationId: event.correlationId,
                    payload: event.payload,
                    metadata: event.metadata,
                    status: 'PENDING'
                }
            });
            // 2. Emit internally
            // We pass the logId so the subscriber can mark it as PROCESSED or FAILED
            this.emit(event.eventName, { ...event, logId: log.id });
            logger_1.default.info(`[EventBus] Published: ${event.eventName} from ${event.sourceModule}`);
        }
        catch (error) {
            logger_1.default.error(`[EventBus] Failed to publish event ${event.eventName}`, error);
        }
    }
    /**
     * Subscribe to an event with a guaranteed wrapper that updates the DB log
     */
    subscribe(eventName, handler) {
        this.on(eventName, async (eventPayload) => {
            const { logId, ...data } = eventPayload;
            try {
                logger_1.default.info(`[EventBus] Handling ${eventName} (Log: ${logId})`);
                // Execute the handler
                await handler(data);
                // Mark as PROCESSED
                if (logId) {
                    await prisma.eventBusLog.update({
                        where: { id: logId },
                        data: {
                            status: 'PROCESSED',
                            processedAt: new Date()
                        }
                    });
                }
            }
            catch (error) {
                logger_1.default.error(`[EventBus] Error handling ${eventName}`, error);
                // Mark as FAILED and increment retry
                if (logId) {
                    await prisma.eventBusLog.update({
                        where: { id: logId },
                        data: {
                            status: 'FAILED',
                            errorMessage: error.message || 'Unknown error',
                            retryCount: { increment: 1 }
                        }
                    });
                }
            }
        });
    }
}
// Export singleton instance
exports.EventBus = new EventBusService();
//# sourceMappingURL=EventBus.js.map