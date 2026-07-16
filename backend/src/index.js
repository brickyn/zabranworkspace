"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const dotenv_1 = __importDefault(require("dotenv"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const errorHandler_1 = require("./middlewares/errorHandler");
const prisma_1 = __importDefault(require("./prisma"));
const logger_1 = __importDefault(require("./utils/logger"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const cashManagement_routes_1 = __importDefault(require("./routes/cashManagement.routes"));
const product_routes_1 = __importDefault(require("./routes/product.routes"));
const inventory_routes_1 = __importDefault(require("./routes/inventory.routes"));
const transaction_routes_1 = __importDefault(require("./routes/transaction.routes"));
const branch_routes_1 = __importDefault(require("./routes/branch.routes"));
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const dashboard_routes_1 = __importDefault(require("./routes/dashboard.routes"));
const pembelian_routes_1 = __importDefault(require("./routes/pembelian.routes"));
const laporan_routes_1 = __importDefault(require("./routes/laporan.routes"));
const biaya_routes_1 = __importDefault(require("./routes/biaya.routes"));
const sales_targets_routes_1 = __importDefault(require("./routes/sales-targets.routes"));
const service_routes_1 = __importDefault(require("./routes/service.routes"));
const rental_routes_1 = __importDefault(require("./routes/rental.routes"));
const finance_routes_1 = __importDefault(require("./routes/finance.routes"));
const warranty_routes_1 = __importDefault(require("./routes/warranty.routes"));
const notification_routes_1 = __importDefault(require("./routes/notification.routes"));
const promo_routes_1 = __importDefault(require("./routes/promo.routes"));
const b2b_routes_1 = __importDefault(require("./routes/b2b.routes"));
const bsb_routes_1 = __importDefault(require("./routes/bsb.routes"));
const crm_routes_1 = __importDefault(require("./routes/crm.routes"));
const dataImport_routes_1 = __importDefault(require("./routes/dataImport.routes"));
const customer_routes_1 = __importDefault(require("./routes/customer.routes"));
const setting_routes_1 = __importDefault(require("./routes/setting.routes"));
const search_routes_1 = __importDefault(require("./routes/search.routes"));
const meta_routes_1 = __importDefault(require("./routes/meta.routes"));
const system_routes_1 = __importDefault(require("./routes/system.routes"));
const kpi_routes_1 = __importDefault(require("./routes/kpi.routes"));
const scalev_routes_1 = __importDefault(require("./routes/scalev.routes"));
const delegation_routes_1 = __importDefault(require("./routes/delegation.routes"));
const workflow_routes_1 = __importDefault(require("./routes/workflow.routes"));
const rule_routes_1 = __importDefault(require("./routes/rule.routes"));
const job_routes_1 = __importDefault(require("./routes/job.routes"));
const metadata_routes_1 = __importDefault(require("./routes/metadata.routes"));
const pos_routes_1 = __importDefault(require("./routes/pos.routes"));
const websocket_1 = require("./utils/websocket");
const WorkflowSubscriber_1 = require("./subscribers/WorkflowSubscriber");
const JobWorker_1 = require("./workers/JobWorker");
dotenv_1.default.config();
// ─── CRITICAL: Crash on startup if JWT secret is not set ─────────────────────
if (!process.env.JWT_SECRET) {
    logger_1.default.error('FATAL: JWT_SECRET environment variable is not set. Application cannot start.');
    process.exit(1);
}
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
const ALLOWED_ORIGIN = process.env.FRONTEND_URL || 'http://localhost:3000';
// ─── Rate Limiters ────────────────────────────────────────────────────────────
const loginLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // max 10 login attempts per window
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: 'Too many login attempts. Please try again after 15 minutes.' }
});
const generalLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000, // 1 minute
    max: 200, // max 200 requests/min per IP
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: 'Rate limit exceeded. Please slow down.' }
});
// ─── Middleware ───────────────────────────────────────────────────────────────
app.use((0, cors_1.default)({
    origin: ALLOWED_ORIGIN,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use((0, helmet_1.default)());
app.use((0, morgan_1.default)('combined', { stream: { write: (message) => logger_1.default.info(message.trim()) } }));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Basic Health Check Route
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'success', message: 'Backend is running smoothly.' });
});
// Apply general rate limiter to all routes
app.use(generalLimiter);
// API Routes (Version 1)
app.use('/api/v1/auth', loginLimiter, auth_routes_1.default); // Stricter limiter on auth
app.use('/api/v1/products', product_routes_1.default);
app.use('/api/v1/inventory', inventory_routes_1.default);
app.use('/api/v1/transactions', transaction_routes_1.default);
app.use('/api/v1/branches', branch_routes_1.default);
app.use('/api/v1/users', user_routes_1.default);
app.use('/api/v1/dashboard', dashboard_routes_1.default);
app.use('/api/v1/purchases', pembelian_routes_1.default);
app.use('/api/v1/reports', laporan_routes_1.default);
app.use('/api/v1/expenses', biaya_routes_1.default);
app.use('/api/v1/cash-management', cashManagement_routes_1.default);
app.use('/api/v1/delegations', delegation_routes_1.default);
app.use('/api/v1/sales-targets', sales_targets_routes_1.default);
app.use('/api/v1/service-center', service_routes_1.default);
app.use('/api/v1/rentals', rental_routes_1.default);
app.use('/api/v1/finance', finance_routes_1.default);
app.use('/api/v1/warranties', warranty_routes_1.default);
app.use('/api/v1/notifications', notification_routes_1.default);
app.use('/api/v1/promos', promo_routes_1.default);
app.use('/api/v1/b2b', b2b_routes_1.default);
app.use('/api/v1/bsb', bsb_routes_1.default);
app.use('/api/v1/crm', crm_routes_1.default);
app.use('/api/v1/customers', customer_routes_1.default);
app.use('/api/v1/settings', setting_routes_1.default);
app.use('/api/v1/search', search_routes_1.default);
app.use('/api/v1/meta', meta_routes_1.default);
app.use('/api/v1/system', system_routes_1.default);
app.use('/api/v1/workflows', workflow_routes_1.default);
app.use('/api/v1/rules', rule_routes_1.default);
app.use('/api/v1/jobs', job_routes_1.default);
app.use('/api/v1/metadata', metadata_routes_1.default);
app.use('/api/v1/kpi', kpi_routes_1.default);
app.use('/api/v1/scalev', scalev_routes_1.default);
app.use('/api/v1/pos', pos_routes_1.default);
app.use('/api/v1/data-import', dataImport_routes_1.default);
// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use(errorHandler_1.errorHandler);
// 404 handler
app.use((req, res) => {
    res.status(404).json({ success: false, error: 'Route not found' });
});
// Start Server
const server = app.listen(PORT, () => {
    logger_1.default.info(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
// Initialize WebSockets
(0, websocket_1.initWebSocket)(server);
// Initialize Event Bus Subscribers
(0, WorkflowSubscriber_1.registerWorkflowSubscribers)();
// Initialize Job Worker
JobWorker_1.JobWorker.registerHandler('PDF_GENERATION', async (job) => {
    const payload = job.payload;
    logger_1.default.info(`Generating PDF for ${payload?.reportId}...`);
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate 2s work
    return { url: `https://storage.zabran.com/reports/${payload?.reportId}.pdf` };
});
JobWorker_1.JobWorker.registerHandler('EMAIL_DELIVERY', async (job) => {
    const payload = job.payload;
    logger_1.default.info(`Sending email to ${payload?.to}...`);
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { success: true };
});
JobWorker_1.JobWorker.start();
// ─── Graceful Shutdown ────────────────────────────────────────────────────────
const gracefulShutdown = async () => {
    logger_1.default.info('Shutting down gracefully...');
    JobWorker_1.JobWorker.stop(); // Stop pulling new jobs
    server.close(() => {
        logger_1.default.info('HTTP server closed.');
    });
    await prisma_1.default.$disconnect();
    logger_1.default.info('Prisma disconnected.');
    process.exit(0);
};
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
process.on('SIGUSR2', gracefulShutdown); // For nodemon restarts
process.on('unhandledRejection', (err) => {
    logger_1.default.error('UNHANDLED REJECTION! 💥 Shutting down...', err);
    process.exit(1);
});
process.on('uncaughtException', (err) => {
    logger_1.default.error('UNCAUGHT EXCEPTION! 💥 Shutting down...', err);
    process.exit(1);
});
//# sourceMappingURL=index.js.map