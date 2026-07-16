"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.enqueueTestJob = exports.cancelJob = exports.retryJob = exports.getJobs = void 0;
const client_1 = require("@prisma/client");
const JobQueue_1 = require("../services/JobQueue");
const catchAsync_1 = require("../utils/catchAsync");
const prisma = new client_1.PrismaClient();
exports.getJobs = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const status = req.query.status;
    const type = req.query.type;
    const where = {};
    if (status)
        where.status = String(status);
    if (type)
        where.type = String(type);
    const jobs = await prisma.backgroundJob.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 100
    });
    res.json(jobs);
});
exports.retryJob = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const id = req.params.id;
    const job = await JobQueue_1.JobQueue.retryFailedJob(id);
    res.json({ message: 'Job queued for retry', job });
});
exports.cancelJob = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const id = req.params.id;
    await JobQueue_1.JobQueue.cancelJob(id);
    res.json({ message: 'Job cancelled' });
});
// A test endpoint to enqueue dummy jobs
exports.enqueueTestJob = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { type, payload } = req.body;
    const user = req.user;
    const job = await JobQueue_1.JobQueue.enqueue(type || 'TEST_JOB', 'SYSTEM', payload || { message: 'Hello World' }, { createdBy: user.id });
    res.status(201).json(job);
});
//# sourceMappingURL=job.controller.js.map