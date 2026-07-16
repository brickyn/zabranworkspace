import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { JobQueue } from '../services/JobQueue';
import { catchAsync } from '../utils/catchAsync';

const prisma = new PrismaClient();

export const getJobs = catchAsync(async (req: Request, res: Response) => {
  const { status, type } = req.query;
  const where: any = {};
  if (status) where.status = String(status);
  if (type) where.type = String(type);
  
  const jobs = await prisma.backgroundJob.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 100
  });
  
  res.json(jobs);
});

export const retryJob = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const job = await JobQueue.retryFailedJob(id);
  res.json({ message: 'Job queued for retry', job });
});

export const cancelJob = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  await JobQueue.cancelJob(id);
  res.json({ message: 'Job cancelled' });
});

// A test endpoint to enqueue dummy jobs
export const enqueueTestJob = catchAsync(async (req: Request, res: Response) => {
  const { type, payload } = req.body;
  const user = (req as any).user;
  
  const job = await JobQueue.enqueue(
    type || 'TEST_JOB',
    'SYSTEM',
    payload || { message: 'Hello World' },
    { createdBy: user.id }
  );
  
  res.status(201).json(job);
});
