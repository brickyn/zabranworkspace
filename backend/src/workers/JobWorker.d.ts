import { BackgroundJob } from '@prisma/client';
type JobHandler = (job: BackgroundJob) => Promise<any>;
declare class JobWorkerService {
    private isRunning;
    private handlers;
    private pollIntervalMs;
    private concurrencyLimit;
    private activeJobs;
    /**
     * Register a handler for a specific job type
     */
    registerHandler(type: string, handler: JobHandler): void;
    /**
     * Start the worker loop
     */
    start(): void;
    stop(): void;
    private poll;
    private fetchAndProcessJob;
    private handleJobFailure;
}
export declare const JobWorker: JobWorkerService;
export {};
//# sourceMappingURL=JobWorker.d.ts.map