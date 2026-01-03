import cors from 'cors';
import dotenv from 'dotenv';
import express, { type Express } from 'express';
import { checkDatabaseConnection, closeDatabaseConnection } from './db';

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

// Health check endpoint
app.get('/api/health', async (_req, res) => {
  const dbStatus = await checkDatabaseConnection();

  res.json({
    status: dbStatus.connected ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    services: {
      api: 'ok',
      database: dbStatus.connected ? 'ok' : 'error',
    },
    database: {
      connected: dbStatus.connected,
      latencyMs: dbStatus.latencyMs,
      error: dbStatus.error,
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
