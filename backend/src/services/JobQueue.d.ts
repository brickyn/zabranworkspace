export interface EnqueueOptions {
    queue?: string;
    priority?: number;
    maxRetries?: number;
    delayMs?: number;
    createdBy?: string;
}
export declare class JobQueueService {
    /**
     * Enqueue a new background job
     */
    enqueue(type: string, moduleName: string, payload: any, options?: EnqueueOptions): Promise<{
        type: string;
        id: string;
        result: import("@prisma/client/runtime/library").JsonValue | null;
        createdAt: Date;
        updatedAt: Date;
        module: string;
        status: string;
        createdBy: string | null;
        payload: import("@prisma/client/runtime/library").JsonValue;
        retryCount: number;
        durationMs: number | null;
        priority: number;
        queue: string;
        failureReason: string | null;
        maxRetries: number;
        runAt: Date;
        startedAt: Date | null;
        finishedAt: Date | null;
        workerId: string | null;
    }>;
    /**
     * Cancel a pending job
     */
    cancelJob(id: string): Promise<import(".prisma/client").Prisma.BatchPayload>;
    /**
     * Manually trigger a retry for a failed job
     */
    retryFailedJob(id: string): Promise<{
        type: string;
        id: string;
        result: import("@prisma/client/runtime/library").JsonValue | null;
        createdAt: Date;
        updatedAt: Date;
        module: string;
        status: string;
        createdBy: string | null;
        payload: import("@prisma/client/runtime/library").JsonValue;
        retryCount: number;
        durationMs: number | null;
        priority: number;
        queue: string;
        failureReason: string | null;
        maxRetries: number;
        runAt: Date;
        startedAt: Date | null;
        finishedAt: Date | null;
        workerId: string | null;
    }>;
}
export declare const JobQueue: JobQueueService;
//# sourceMappingURL=JobQueue.d.ts.map