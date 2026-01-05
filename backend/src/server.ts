import cookieParser from 'cookie-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import express, { type Express } from 'express';
import passport from 'passport';
import { checkDatabaseConnection, closeDatabaseConnection } from './db';
import { getRedisUnavailableCount } from './lib/rate-limiter';
import { checkRedisConnection } from './lib/redis';
import authRoutes from './routes/auth';
import csrfRoutes from './routes/csrf';
import graphRoutes from './routes/graph';
import individualsRoutes from './routes/individuals';
import mediaRoutes from './routes/media';
import organizationsRoutes from './routes/organizations';
import powRoutes from './routes/pow';
import reportsRoutes from './routes/reports';
import rolesRoutes from './routes/roles';
import votesRoutes from './routes/votes';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
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

// Health check endpoint
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

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
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
