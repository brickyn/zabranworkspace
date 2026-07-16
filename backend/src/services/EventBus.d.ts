import { EventEmitter } from 'events';
import { DomainEventPayload } from '../types/events';
declare class EventBusService extends EventEmitter {
    constructor();
    /**
     * Publish an event to the Event Bus
     */
    publish(event: DomainEventPayload): Promise<void>;
    /**
     * Subscribe to an event with a guaranteed wrapper that updates the DB log
     */
    subscribe(eventName: string, handler: (payload: any) => Promise<void>): void;
}
export declare const EventBus: EventBusService;
export {};
//# sourceMappingURL=EventBus.d.ts.map