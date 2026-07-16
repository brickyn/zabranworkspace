import { EventBus } from '../services/EventBus';
import { DomainEvents } from '../types/events';
import logger from '../utils/logger';

export function registerWorkflowSubscribers() {
  EventBus.subscribe(DomainEvents.WorkflowTransitioned, async (payload: any) => {
    logger.info(`[WorkflowSubscriber] Processing transition for ${payload.entityType}:${payload.entityId}`);
    
    const actions = payload.payload?.actions || [];
    
    // Simulate Action Dispatcher that was previously in WorkflowEngine
    for (const action of actions) {
      switch (action) {
        case 'RESERVE_INVENTORY':
          logger.info(`[Action Executed] RESERVE_INVENTORY for ${payload.entityId}`);
          // Will be connected to Inventory Service logic
          break;
        case 'NOTIFY_MANAGER':
          logger.info(`[Action Executed] NOTIFY_MANAGER for ${payload.entityId}`);
          // Send push notification or email
          break;
        case 'RELEASE_INVENTORY':
          logger.info(`[Action Executed] RELEASE_INVENTORY for ${payload.entityId}`);
          break;
        case 'UPDATE_STOCK':
          logger.info(`[Action Executed] UPDATE_STOCK for ${payload.entityId}`);
          break;
        case 'NOTIFY_WAREHOUSE':
          logger.info(`[Action Executed] NOTIFY_WAREHOUSE for ${payload.entityId}`);
          break;
        case 'UPDATE_LOGISTICS':
          logger.info(`[Action Executed] UPDATE_LOGISTICS for ${payload.entityId}`);
          break;
        default:
          logger.warn(`[WorkflowSubscriber] Unknown workflow action: ${action}`);
      }
    }
  });
}
