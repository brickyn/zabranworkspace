import { PrismaClient, BackgroundJob } from '@prisma/client';
import logger from '../utils/logger';

const prisma = new PrismaClient();
const WORKER_ID = `worker-${Math.random().toString(36).substring(7)}`;

type JobHandler = (job: BackgroundJob) => Promise<any>;

class JobWorkerService {
  private isRunning = false;
  private handlers: Map<string, JobHandler> = new Map();
  private pollIntervalMs = 5000;
  private concurrencyLimit = 3;
  private activeJobs = 0;

  /**
   * Register a handler for a specific job type
   */
  public registerHandler(type: string, handler: JobHandler) {
    this.handlers.set(type, handler);
    logger.info(`[JobWorker] Registered handler for job type: ${type}`);
  }

  /**
   * Start the worker loop
   */
  public start() {
    if (this.isRunning) return;
    this.isRunning = true;
    logger.info(`[JobWorker] Started polling for jobs. Worker ID: ${WORKER_ID}`);
    this.poll();
  }

  public stop() {
    this.isRunning = false;
    logger.info(`[JobWorker] Stopped polling.`);
  }

  private async poll() {
    if (!this.isRunning) return;

    if (this.activeJobs < this.concurrencyLimit) {
      await this.fetchAndProcessJob();
    }

    setTimeout(() => this.poll(), this.pollIntervalMs);
  }

  private async fetchAndProcessJob() {
    let job: BackgroundJob | null = null;
    try {
      // 1. Fetch a job atomically (simulating row lock by updating state immediately)
      const jobs = await prisma.$queryRaw<BackgroundJob[]>`
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

      if (!jobs || jobs.length === 0) return; // No jobs available

      job = jobs[0];
      this.activeJobs++;
      
      logger.info(`[JobWorker] Processing job ${job.id} of type ${job.type}`);

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

      logger.info(`[JobWorker] Job ${job.id} COMPLETED in ${durationMs}ms`);

    } catch (error: any) {
      logger.error(`[JobWorker] Error processing job`, error);
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
    } finally {
      if (job && this.activeJobs > 0) this.activeJobs--;
    }
  }

  private async handleJobFailure(error: any) {
    logger.error(`[JobWorker] Fatal Error in worker loop:`, error);
  }
}

export const JobWorker = new JobWorkerService();


