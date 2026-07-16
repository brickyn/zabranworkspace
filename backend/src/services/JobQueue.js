"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobQueue = exports.JobQueueService = void 0;
const client_1 = require("@prisma/client");
const logger_1 = __importDefault(require("../utils/logger"));
const prisma = new client_1.PrismaClient();
class JobQueueService {
    /**
     * Enqueue a new background job
     */
    async enqueue(type, moduleName, payload, options = {}) {
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
            logger_1.default.info(`[JobQueue] Enqueued job ${job.id} of type ${type}`);
            return job;
        }
        catch (error) {
            logger_1.default.error(`[JobQueue] Failed to enqueue job ${type}`, error);
            throw error;
        }
    }
    /**
     * Cancel a pending job
     */
    async cancelJob(id) {
        return prisma.backgroundJob.updateMany({
            where: { id, status: 'QUEUED' },
            data: { status: 'CANCELLED' }
        });
    }
    /**
     * Manually trigger a retry for a failed job
     */
    async retryFailedJob(id) {
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
exports.JobQueueService = JobQueueService;
exports.JobQueue = new JobQueueService();
//# sourceMappingURL=JobQueue.js.map