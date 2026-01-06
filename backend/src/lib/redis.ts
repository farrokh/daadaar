import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL;
const useTls = redisUrl?.startsWith('rediss://') ?? false;

if (!redisUrl) {
  console.warn(
    'REDIS_URL not found in environment variables. Redis-based features will be disabled.'
  );
}

// Lazy Redis connection to avoid blocking app startup
let redisInstance: Redis | null = null;

function getRedisClient(): Redis | null {
  if (!redisUrl) return null;

  if (!redisInstance) {
    redisInstance = new Redis(redisUrl, {
      lazyConnect: true, // Don't connect immediately
      maxRetriesPerRequest: 3,
      retryStrategy: times => {
        if (times > 3) {
          console.error('Redis connection failed after 3 retries');
          return null; // Stop retrying
        }
        return Math.min(times * 100, 2000); // Exponential backoff
      },
      connectTimeout: 10000,
      ...(useTls ? { tls: {} } : {}),
    });

    // Handle connection errors gracefully
    redisInstance.on('error', err => {
      console.error('Redis connection error:', err.message);
    });

    // Attempt to connect but don't wait for it
    redisInstance.connect().catch(err => {
      console.error('Failed to connect to Redis:', err.message);
    });
  }

  return redisInstance;
}

// Export getter function instead of direct instance
export const redis = new Proxy({} as Redis, {
  get(_target, prop: string | symbol) {
    const client = getRedisClient();
    if (!client) return undefined;
    // biome-ignore lint/suspicious/noExplicitAny: Proxy requires dynamic property access
    const value = (client as any)[prop];
    return typeof value === 'function' ? value.bind(client) : value;
  },
});

export const checkRedisConnection = async () => {
  const client = getRedisClient();
  if (!client) return { connected: false, error: 'Redis client not initialized' };

  try {
    const start = Date.now();
    await client.ping();
    return {
      connected: true,
      latencyMs: Date.now() - start,
    };
  } catch (error) {
    return {
      connected: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
};
