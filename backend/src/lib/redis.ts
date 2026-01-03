import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  console.warn('REDIS_URL not found in environment variables. Redis-based features will be disabled.');
}

export const redis = redisUrl ? new Redis(redisUrl) : null;

export const checkRedisConnection = async () => {
  if (!redis) return { connected: false, error: 'Redis client not initialized' };
  
  try {
    const start = Date.now();
    await redis.ping();
    return {
      connected: true,
      latencyMs: Date.now() - start
    };
  } catch (error) {
    return {
      connected: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
};

