import { EventEmitter } from 'events';
import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger';
import { DomainEventPayload } from '../types/events';

const prisma = new PrismaClient();

class EventBusService extends EventEmitter {
  constructor() {
    super();
    // Allow unlimited listeners or set to a higher limit
    this.setMaxListeners(50);
  }

  /**
   * Publish an event to the Event Bus
   */
  public async publish(event: DomainEventPayload): Promise<void> {
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
      
      logger.info(`[EventBus] Published: ${event.eventName} from ${event.sourceModule}`);
    } catch (error) {
      logger.error(`[EventBus] Failed to publish event ${event.eventName}`, error);
    }
  }

  /**
   * Subscribe to an event with a guaranteed wrapper that updates the DB log
   */
  public subscribe(eventName: string, handler: (payload: any) => Promise<void>) {
    this.on(eventName, async (eventPayload) => {
      const { logId, ...data } = eventPayload;
      
      try {
        logger.info(`[EventBus] Handling ${eventName} (Log: ${logId})`);
        
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
      } catch (error: any) {
        logger.error(`[EventBus] Error handling ${eventName}`, error);
        
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
export const EventBus = new EventBusService();
