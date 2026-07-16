import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger';

const prisma = new PrismaClient();

export interface EnqueueOptions {
  queue?: string;
  priority?: number;
  maxRetries?: number;
  delayMs?: number; // Delay in milliseconds
  createdBy?: string;
}

export class JobQueueService {
  /**
   * Enqueue a new background job
   */
  public async enqueue(type: string, moduleName: string, payload: any, options: EnqueueOptions = {}) {
    try {
      const runAt = options.delayMs ? new Date(Date.now() + options.delayMs) : new Date();

      const job = await prisma.backgroundJob.create({
        data: {
          type,
          module: moduleName,
          payload,
          queue: options.queue || 'default',
          priority: options.priority || 0,
          maxRetries: options.maxRetries || 3,
          runAt,
          createdBy: options.createdBy
        }
      });

      logger.info(`[JobQueue] Enqueued job ${job.id} of type ${type}`);
      return job;
    } catch (error) {
      logger.error(`[JobQueue] Failed to enqueue job ${type}`, error);
      throw error;
    }
  }

  /**
   * Cancel a pending job
   */
  public async cancelJob(id: string) {
    return prisma.backgroundJob.updateMany({
      where: { id, status: 'QUEUED' },
      data: { status: 'CANCELLED' }
    });
  }

  /**
   * Manually trigger a retry for a failed job
   */
  public async retryFailedJob(id: string) {
    return prisma.backgroundJob.update({
      where: { id },
      data: {
        status: 'QUEUED',
        retryCount: 0,
        failureReason: null
      }
    });
  }
}

export const JobQueue = new JobQueueService();
