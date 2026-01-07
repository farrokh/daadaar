import cookieParser from 'cookie-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import express, { type Express } from 'express';
import passport from 'passport';
import { checkDatabaseConnection, closeDatabaseConnection } from './db';
import { getRedisUnavailableCount } from './lib/rate-limiter';
import { checkRedisConnection } from './lib/redis';
import { checkSlackNotifierHealth } from './lib/slack';
import adminContentReportsRoutes from './routes/admin/content-reports';
import adminIndividualsRoutes from './routes/admin/individuals';
import adminOrganizationsRoutes from './routes/admin/organizations';
import adminRolesRoutes from './routes/admin/roles';
import adminUsersRoutes from './routes/admin/users';
import authRoutes from './routes/auth';
import contentReportsRoutes from './routes/content-reports';
import csrfRoutes from './routes/csrf';
import graphRoutes from './routes/graph';
import individualsRoutes from './routes/individuals';
import mediaRoutes from './routes/media';
import organizationsRoutes from './routes/organizations';
import powRoutes from './routes/pow';
import reportsRoutes from './routes/reports';
import rolesRoutes from './routes/roles';
import shareRoutes from './routes/share';
import votesRoutes from './routes/votes';

if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

const app: Express = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(
  cors({
    origin: (origin, callback) => {
      const allowedOrigins = [
        process.env.FRONTEND_URL,
        'https://daadaar.com',
        'https://www.daadaar.com',
        'http://localhost:3000',
        'http://127.0.0.1:3000',
      ].filter(Boolean);

      if (!origin || allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(passport.initialize());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api', csrfRoutes);
app.use('/api/graph', graphRoutes);
app.use('/api/organizations', organizationsRoutes);
app.use('/api/individuals', individualsRoutes);
app.use('/api/roles', rolesRoutes);
app.use('/api/pow', powRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/votes', votesRoutes);
app.use('/api/content-reports', contentReportsRoutes);
app.use('/api/share', shareRoutes);
app.use('/api/admin/content-reports', adminContentReportsRoutes);
app.use('/api/admin/users', adminUsersRoutes);
app.use('/api/admin/organizations', adminOrganizationsRoutes);
app.use('/api/admin/roles', adminRolesRoutes);
app.use('/api/admin/individuals', adminIndividualsRoutes);

// Simple health check for App Runner (no DB/Redis checks to avoid timeouts)
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'daadaar-backend',
  });
});

// Detailed health check endpoint with DB/Redis status
app.get('/api/health', async (_req, res) => {
  const dbStatus = await checkDatabaseConnection();
  const redisStatus = await checkRedisConnection();
  const rateLimiterRedisUnavailableCount = getRedisUnavailableCount();

  res.json({
    status: dbStatus.connected && redisStatus.connected ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    services: {
      api: 'ok',
      database: dbStatus.connected ? 'ok' : 'error',
      redis: redisStatus.connected ? 'ok' : 'error',
    },
    database: {
      connected: dbStatus.connected,
      latencyMs: dbStatus.latencyMs,
      error: dbStatus.error,
    },
    redis: {
      connected: redisStatus.connected,
      latencyMs: redisStatus.latencyMs,
      error: redisStatus.error,
    },
    rateLimiter: {
      redisUnavailableCount: rateLimiterRedisUnavailableCount,
      usingInMemoryFallback: !redisStatus.connected && rateLimiterRedisUnavailableCount > 0,
    },
  });
});

// Slack notifications health check (safe dry-run)
app.get('/api/health/notifications/slack', async (_req, res) => {
  const slackHealth = await checkSlackNotifierHealth();
  res.status(slackHealth.ok ? 200 : 503).json({
    success: slackHealth.ok,
    data: slackHealth,
  });
});

// Start server
const server = app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`🚀 Backend server running on http://0.0.0.0:${PORT}`);
});

// Graceful shutdown
const shutdown = async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await closeDatabaseConnection();
  server.close(() => {
    console.log('👋 Server closed');
    process.exit(0);
  });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

export default app;
