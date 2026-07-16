"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobWorker = void 0;
const client_1 = require("@prisma/client");
const logger_1 = __importDefault(require("../utils/logger"));
const prisma = new client_1.PrismaClient();
const WORKER_ID = `worker-${Math.random().toString(36).substring(7)}`;
class JobWorkerService {
    isRunning = false;
    handlers = new Map();
    pollIntervalMs = 5000;
    concurrencyLimit = 3;
    activeJobs = 0;
    /**
     * Register a handler for a specific job type
     */
    registerHandler(type, handler) {
        this.handlers.set(type, handler);
        logger_1.default.info(`[JobWorker] Registered handler for job type: ${type}`);
    }
    /**
     * Start the worker loop
     */
    start() {
        if (this.isRunning)
            return;
        this.isRunning = true;
        logger_1.default.info(`[JobWorker] Started polling for jobs. Worker ID: ${WORKER_ID}`);
        this.poll();
    }
    stop() {
        this.isRunning = false;
        logger_1.default.info(`[JobWorker] Stopped polling.`);
    }
    async poll() {
        if (!this.isRunning)
            return;
        if (this.activeJobs < this.concurrencyLimit) {
            await this.fetchAndProcessJob();
        }
        setTimeout(() => this.poll(), this.pollIntervalMs);
    }
    async fetchAndProcessJob() {
        let job = null;
        try {
            // 1. Fetch a job atomically (simulating row lock by updating state immediately)
            const jobs = await prisma.$queryRaw `
        UPDATE "background_jobs"
        SET status = 'RUNNING', "workerId" = ${WORKER_ID}, "startedAt" = NOW()
        WHERE id = (
          SELECT id FROM "background_jobs"
          WHERE status = 'QUEUED' 
            AND "runAt" <= NOW()
          ORDER BY priority DESC, "createdAt" ASC
          FOR UPDATE SKIP LOCKED
          LIMIT 1
        )
        RETURNING *;
      `;
            if (!jobs || jobs.length === 0)
                return; // No jobs available
            job = jobs[0];
            this.activeJobs++;
            logger_1.default.info(`[JobWorker] Processing job ${job.id} of type ${job.type}`);
            const handler = this.handlers.get(job.type);
            if (!handler) {
                throw new Error(`No handler registered for job type: ${job.type}`);
            }
            // 2. Execute Handler
            const startTime = Date.now();
            const result = await handler(job);
            const durationMs = Date.now() - startTime;
            // 3. Mark as COMPLETED
            await prisma.backgroundJob.update({
                where: { id: job.id },
                data: {
                    status: 'COMPLETED',
                    result: result || {},
                    finishedAt: new Date(),
                    durationMs
                }
            });
            logger_1.default.info(`[JobWorker] Job ${job.id} COMPLETED in ${durationMs}ms`);
        }
        catch (error) {
            logger_1.default.error(`[JobWorker] Error processing job`, error);
            if (job) {
                const isRetryable = job.retryCount < job.maxRetries;
                await prisma.backgroundJob.update({
                    where: { id: job.id },
                    data: {
                        status: isRetryable ? 'QUEUED' : 'FAILED',
                        failureReason: error.message || 'Unknown error',
                        retryCount: { increment: 1 },
                        // Delay next run if retrying (e.g. 5 minutes)
                        runAt: isRetryable ? new Date(Date.now() + 5 * 60 * 1000) : job.runAt
                    }
                });
            }
        }
        finally {
            if (job && this.activeJobs > 0)
                this.activeJobs--;
        }
    }
    async handleJobFailure(error) {
        logger_1.default.error(`[JobWorker] Fatal Error in worker loop:`, error);
    }
}
exports.JobWorker = new JobWorkerService();
//# sourceMappingURL=JobWorker.js.map