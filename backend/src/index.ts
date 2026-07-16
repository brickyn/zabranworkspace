import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { errorHandler } from './middlewares/errorHandler';
import prisma from './prisma';
import logger from './utils/logger';
import authRoutes from './routes/auth.routes';
import cashManagementRoutes from './routes/cashManagement.routes';
import productRoutes from './routes/product.routes';
import inventoryRoutes from './routes/inventory.routes';
import transactionRoutes from './routes/transaction.routes';
import branchRoutes from './routes/branch.routes';
import userRoutes from './routes/user.routes';
import dashboardRoutes from './routes/dashboard.routes';
import pembelianRoutes from './routes/pembelian.routes';
import laporanRoutes from './routes/laporan.routes';
import biayaRoutes from './routes/biaya.routes';
import salesTargetsRoutes from './routes/sales-targets.routes';
import serviceRoutes from './routes/service.routes';
import rentalRoutes from './routes/rental.routes';
import financeRoutes from './routes/finance.routes';
import warrantyRoutes from './routes/warranty.routes';
import notificationRoutes from './routes/notification.routes';
import promoRoutes from './routes/promo.routes';
import b2bRoutes from './routes/b2b.routes';
import bsbRoutes from './routes/bsb.routes';
import crmRoutes from './routes/crm.routes';
import dataImportRoutes from './routes/dataImport.routes';
import customerRoutes from './routes/customer.routes';
import settingRoutes from './routes/setting.routes';
import searchRoutes from './routes/search.routes';
import metaRoutes from './routes/meta.routes';
import systemRoutes from './routes/system.routes';
import kpiRoutes from './routes/kpi.routes';
import scalevRoutes from './routes/scalev.routes';
import delegationRoutes from './routes/delegation.routes';
import workflowRoutes from './routes/workflow.routes';
import ruleRoutes from './routes/rule.routes';
import jobRoutes from './routes/job.routes';
import metadataRoutes from './routes/metadata.routes';
import posRoutes from './routes/pos.routes';
import { initWebSocket } from './utils/websocket';
import { registerWorkflowSubscribers } from './subscribers/WorkflowSubscriber';
import { JobWorker } from './workers/JobWorker';

dotenv.config();

// ─── CRITICAL: Crash on startup if JWT secret is not set ─────────────────────
if (!process.env.JWT_SECRET) {
  logger.error('FATAL: JWT_SECRET environment variable is not set. Application cannot start.');
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3001;
const ALLOWED_ORIGIN = process.env.FRONTEND_URL || 'http://localhost:3000';

// ─── Rate Limiters ────────────────────────────────────────────────────────────
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,                   // max 10 login attempts per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many login attempts. Please try again after 15 minutes.' }
});

const generalLimiter = rateLimit({
  windowMs: 60 * 1000,       // 1 minute
  max: 200,                  // max 200 requests/min per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Rate limit exceeded. Please slow down.' }
});

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({
  origin: ALLOWED_ORIGIN,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(helmet());
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basic Health Check Route
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'success', message: 'Backend is running smoothly.' });
});

// Apply general rate limiter to all routes
app.use(generalLimiter);

// API Routes (Version 1)
app.use('/api/v1/auth', loginLimiter, authRoutes); // Stricter limiter on auth
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/inventory', inventoryRoutes);
app.use('/api/v1/transactions', transactionRoutes);
app.use('/api/v1/branches', branchRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/purchases', pembelianRoutes);
app.use('/api/v1/reports', laporanRoutes);
app.use('/api/v1/expenses', biayaRoutes);
app.use('/api/v1/cash-management', cashManagementRoutes);
app.use('/api/v1/delegations', delegationRoutes);
app.use('/api/v1/sales-targets', salesTargetsRoutes);
app.use('/api/v1/service-center', serviceRoutes);
app.use('/api/v1/rentals', rentalRoutes);
app.use('/api/v1/finance', financeRoutes);
app.use('/api/v1/warranties', warrantyRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/promos', promoRoutes);
app.use('/api/v1/b2b', b2bRoutes);
app.use('/api/v1/bsb', bsbRoutes);
app.use('/api/v1/crm', crmRoutes);
app.use('/api/v1/customers', customerRoutes);
app.use('/api/v1/settings', settingRoutes);
app.use('/api/v1/search', searchRoutes);
app.use('/api/v1/meta', metaRoutes);
app.use('/api/v1/system', systemRoutes);
app.use('/api/v1/workflows', workflowRoutes);
app.use('/api/v1/rules', ruleRoutes);
app.use('/api/v1/jobs', jobRoutes);
app.use('/api/v1/metadata', metadataRoutes);
app.use('/api/v1/kpi', kpiRoutes);
app.use('/api/v1/scalev', scalevRoutes);
app.use('/api/v1/pos', posRoutes);
app.use('/api/v1/data-import', dataImportRoutes);

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use(errorHandler as express.ErrorRequestHandler);

// 404 handler
app.use((req: any, res: any) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

// Start Server
const server = app.listen(PORT, () => {
  logger.info(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

// Initialize WebSockets
initWebSocket(server);

// Initialize Event Bus Subscribers
registerWorkflowSubscribers();

// Initialize Job Worker
JobWorker.registerHandler('PDF_GENERATION', async (job) => {
  const payload = job.payload as any;
  logger.info(`Generating PDF for ${payload?.reportId}...`);
  await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate 2s work
  return { url: `https://storage.zabran.com/reports/${payload?.reportId}.pdf` };
});
JobWorker.registerHandler('EMAIL_DELIVERY', async (job) => {
  const payload = job.payload as any;
  logger.info(`Sending email to ${payload?.to}...`);
  await new Promise(resolve => setTimeout(resolve, 1000));
  return { success: true };
});
JobWorker.start();

// ─── Graceful Shutdown ────────────────────────────────────────────────────────
const gracefulShutdown = async () => {
  logger.info('Shutting down gracefully...');
  
  JobWorker.stop(); // Stop pulling new jobs
  
  server.close(() => {
    logger.info('HTTP server closed.');
  });
  await prisma.$disconnect();
  logger.info('Prisma disconnected.');
  process.exit(0);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
process.on('SIGUSR2', gracefulShutdown); // For nodemon restarts

process.on('unhandledRejection', (err) => {
  logger.error('UNHANDLED REJECTION! 💥 Shutting down...', err);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  logger.error('UNCAUGHT EXCEPTION! 💥 Shutting down...', err);
  process.exit(1);
});
