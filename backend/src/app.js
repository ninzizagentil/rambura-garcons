import express from 'express';
import compression from 'compression';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { env } from './config/env.js';
import { databaseStatus } from './config/database.js';
import { UPLOADS_ROOT } from './config/localStorage.js';
import authRoutes from './routes/authRoutes.js';
import auditRoutes from './routes/auditRoutes.js';
import userRoutes from './routes/userRoutes.js';
import libraryRoutes from './routes/libraryRoutes.js';
import bookArchiveRoutes from './routes/bookArchiveRoutes.js';
import stockRoutes from './routes/stockRoutes.js';
import reconciliationRoutes from './routes/reconciliationRoutes.js';
import supplierRoutes from './routes/supplierRoutes.js';
import activityRoutes from './routes/activityRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import accessRoutes from './routes/accessRoutes.js';
import { publicRouter, adminRouter, applicationRouter } from './routes/contentRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import equipmentRoutes from './routes/equipmentRoutes.js';
import equipmentRetirementRoutes from './routes/equipmentRetirementRoutes.js';
import equipmentArchiveRoutes from './routes/equipmentArchiveRoutes.js';
import stockArchiveRoutes from './routes/stockArchiveRoutes.js';
import eventRoutes from './routes/eventRoutes.js';
import { notFound, errorHandler } from './middleware/error.js';
import { requireDatabase } from './middleware/database.js';
import { ok } from './utils/api.js';

const app = express();
// Behind nginx/a load balancer set TRUST_PROXY=1 so rate limits and audit logs see the real client IP.
if (env.trustProxy) app.set('trust proxy', env.trustProxy);
app.use(compression({ threshold: '1kb' }));
app.use(helmet());
app.use(cors({
	origin: (origin, callback) => {
		const isConfiguredClient = origin === env.clientUrl;
		const isLocalDevelopmentClient = env.nodeEnv !== 'production'
			&& /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin || '');

		callback(null, !origin || isConfiguredClient || isLocalDevelopmentClient);
	},
	credentials: true,
}));
if (env.nodeEnv === 'production') {
  app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 1000, standardHeaders: 'draft-8' }));
}
// Locally-stored images (replaces Cloudinary). Served before the JSON body
// parser since these are plain static files. The CORP header is relaxed so
// the Vite dev server (a different origin/port) can load these <img> URLs.
app.use('/uploads', (req, res, next) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static(UPLOADS_ROOT));
app.use(express.json({ limit: '8mb' }));
app.use(express.urlencoded({ extended: true, limit: '8mb' }));
app.use(cookieParser());
app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));
app.get('/api/health', (_req, res) => {
	const database = databaseStatus();
	const status = database === 'connected' ? 200 : 503;
	return ok(res, { status: status === 200 ? 'ok' : 'degraded', database, uptimeSeconds: Math.round(process.uptime()), node: process.version, timestamp: new Date().toISOString() }, database === 'connected' ? 'Rambura Garçons API is running' : 'Database unavailable', status);
});
app.get('/api/health/live', (_req, res) => ok(res, { status: 'ok', uptimeSeconds: Math.round(process.uptime()) }));
app.get('/api/health/ready', (_req, res) => {
	const ready = databaseStatus() === 'connected';
	return ok(res, { ready, database: databaseStatus() }, ready ? 'Ready' : 'Database not ready', ready ? 200 : 503);
});
app.use('/api', requireDatabase);
app.use('/api/auth', authRoutes);
app.use('/api/audit-logs', auditRoutes);
app.use('/api/users', userRoutes);
app.use('/api/library', libraryRoutes);
app.use('/api/library/book-archive-requests', bookArchiveRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/equipment', equipmentRoutes);
app.use('/api/equipment-retirement', equipmentRetirementRoutes);
app.use('/api/equipment-archive-requests', equipmentArchiveRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/stock/reconciliations', reconciliationRoutes);
app.use('/api/stock/archive-requests', stockArchiveRoutes);
app.use('/api/stock/suppliers', supplierRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api', accessRoutes);
app.use('/api/public', publicRouter);
app.use('/api', dashboardRoutes); // /admin/dashboard, /management/dashboard (must come before /api/admin/:resource)
app.use('/api/admin', adminRouter);
app.use('/api/applications', applicationRouter);
app.use('/api/notifications', notificationRoutes);
app.use(notFound);
app.use(errorHandler);
export default app;
