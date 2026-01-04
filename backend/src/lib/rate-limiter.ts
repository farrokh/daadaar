import { redis } from './redis';

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  error?: string;
}

/**
 * In-memory rate limit entry with expiration tracking
 */
interface InMemoryRateLimitEntry {
  count: number;
  resetAt: number; // Unix timestamp in milliseconds
}

/**
 * In-memory rate limit store (fallback when Redis is unavailable)
 * Key: rate limit key, Value: entry with count and expiration
 */
const inMemoryRateLimitStore = new Map<string, InMemoryRateLimitEntry>();

/**
 * Cleanup interval for expired entries (runs every 5 minutes)
 */
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;

/**
 * Start cleanup interval to remove expired entries
 */
let cleanupInterval: NodeJS.Timeout | null = null;

function startCleanupInterval() {
  if (cleanupInterval) return; // Already started

  cleanupInterval = setInterval(() => {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of inMemoryRateLimitStore.entries()) {
      if (entry.resetAt <= now) {
        inMemoryRateLimitStore.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.debug(`[RateLimiter] Cleaned up ${cleaned} expired in-memory rate limit entries`);
    }
  }, CLEANUP_INTERVAL_MS);
}

/**
 * Metrics counter for Redis unavailability
 * This should be monitored by your observability system (e.g., Prometheus, CloudWatch)
 */
let redisUnavailableCounter = 0;
let lastRedisUnavailableLog = 0;
const REDIS_UNAVAILABLE_LOG_INTERVAL_MS = 60 * 1000; // Log every minute max

function incrementRedisUnavailableMetric(context: string) {
  redisUnavailableCounter++;
  const now = Date.now();

  // Log prominently every minute (or first occurrence)
  if (now - lastRedisUnavailableLog >= REDIS_UNAVAILABLE_LOG_INTERVAL_MS) {
    console.error(
      `[RATE_LIMITER_ALERT] Redis unavailable - Counter: ${redisUnavailableCounter}, Context: ${context}, Using in-memory fallback`
    );
    lastRedisUnavailableLog = now;
  }
}

/**
 * Get the current Redis unavailable counter (for metrics/health checks)
 */
export function getRedisUnavailableCount(): number {
  return redisUnavailableCounter;
}

/**
 * Environment variable to control fail-closed behavior for critical endpoints
 * When set to 'true', rate limiting will deny requests when Redis is unavailable
 * Default: 'false' (fail-open with in-memory fallback)
 */
const RATE_LIMITER_FAIL_CLOSED = process.env.RATE_LIMITER_FAIL_CLOSED === 'true';

/**
 * In-memory fixed-window rate limiter (fallback when Redis is unavailable)
 * Uses the same fixed-window algorithm as Redis implementation
 */
function checkInMemoryRateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): RateLimitResult {
  const now = Date.now();
  const resetAt = now + windowSeconds * 1000;
  const entry = inMemoryRateLimitStore.get(key);

  if (!entry || entry.resetAt <= now) {
    // New window or expired entry
    inMemoryRateLimitStore.set(key, {
      count: 1,
      resetAt,
    });
    return {
      allowed: true,
      remaining: limit - 1,
      resetAt: new Date(resetAt),
    };
  }

  // Increment count in existing window
  entry.count++;
  const exceeded = entry.count > limit;

  return {
    allowed: !exceeded,
    remaining: Math.max(0, limit - entry.count),
    resetAt: new Date(entry.resetAt),
    error: exceeded
      ? `Rate limit exceeded. Try again after ${new Date(entry.resetAt).toISOString()}`
      : undefined,
  };
}

/**
 * Check if a user/session has exceeded the rate limit
 * @param key - Unique identifier (userId or sessionId)
 * @param limit - Maximum number of requests allowed
 * @param windowSeconds - Time window in seconds
 * @param failClosed - If true, deny requests when Redis is unavailable (overrides env var)
 * @returns Rate limit result
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
  failClosed?: boolean
): Promise<RateLimitResult> {
  const shouldFailClosed = failClosed ?? RATE_LIMITER_FAIL_CLOSED;

  // Check if Redis is available
  if (!redis) {
    incrementRedisUnavailableMetric(`checkRateLimit:${key}`);

    if (shouldFailClosed) {
      // Fail-closed: deny requests when Redis is unavailable
      console.error(
        `[RATE_LIMITER] Fail-closed mode: Denying request due to Redis unavailability (key: ${key})`
      );
      return {
        allowed: false,
        remaining: 0,
        resetAt: new Date(Date.now() + windowSeconds * 1000),
        error: 'Rate limiting service unavailable. Please try again later.',
      };
    }

    // Fail-open with in-memory fallback
    startCleanupInterval();
    return checkInMemoryRateLimit(key, limit, windowSeconds);
  }

  try {
    const rateLimitKey = `ratelimit:${key}`;

    // Atomic Lua script: increment, set TTL if new key, return count and TTL
    // This eliminates TOCTOU race conditions by doing everything atomically
    const luaScript = `
      local count = redis.call('INCR', KEYS[1])
      if count == 1 then
        redis.call('EXPIRE', KEYS[1], ARGV[1])
      end
      local ttl = redis.call('TTL', KEYS[1])
      return {count, ttl}
    `;

    const result = (await redis.eval(luaScript, 1, rateLimitKey, windowSeconds.toString())) as [
      number,
      number,
    ];

    const [newCount, ttl] = result;
    const resetAt = new Date(Date.now() + (ttl > 0 ? ttl * 1000 : windowSeconds * 1000));

    // Check if limit exceeded based on the atomically incremented count
    if (newCount > limit) {
      return {
        allowed: false,
        remaining: 0,
        resetAt,
        error: `Rate limit exceeded. Try again after ${resetAt.toISOString()}`,
      };
    }

    return {
      allowed: true,
      remaining: Math.max(0, limit - newCount),
      resetAt,
    };
  } catch (error) {
    // Redis error - use fallback
    incrementRedisUnavailableMetric(
      `checkRateLimit:${key}:error:${error instanceof Error ? error.message : String(error)}`
    );

    if (shouldFailClosed) {
      // Fail-closed: deny requests when Redis errors occur
      console.error(
        `[RATE_LIMITER] Fail-closed mode: Denying request due to Redis error (key: ${key}):`,
        error
      );
      return {
        allowed: false,
        remaining: 0,
        resetAt: new Date(Date.now() + windowSeconds * 1000),
        error: 'Rate limiting service unavailable. Please try again later.',
      };
    }

    // Fail-open with in-memory fallback
    startCleanupInterval();
    return checkInMemoryRateLimit(key, limit, windowSeconds);
  }
}

/**
 * Check report submission rate limit
 * 5 reports per hour per user/session
 * CRITICAL ENDPOINT: Uses fail-closed by default when Redis is unavailable
 */
export async function checkReportSubmissionLimit(
  userId: number | null,
  sessionId: string | null
): Promise<RateLimitResult> {
  const key = userId ? `user:${userId}:reports` : `session:${sessionId}:reports`;
  const limit = 5;
  const windowSeconds = 60 * 60; // 1 hour

  // Report submission is critical - fail-closed by default
  return checkRateLimit(key, limit, windowSeconds, true);
}

/**
 * Check voting rate limit
 * 100 votes per hour per user/session
 */
export async function checkVotingLimit(
  userId: number | null,
  sessionId: string | null
): Promise<RateLimitResult> {
  const key = userId ? `user:${userId}:votes` : `session:${sessionId}:votes`;
  const limit = 100;
  const windowSeconds = 60 * 60; // 1 hour

  return checkRateLimit(key, limit, windowSeconds);
}

/**
 * Check challenge generation rate limit
 * 30 challenges per hour per user/session
 */
export async function checkChallengeGenerationLimit(
  userId: number | null,
  sessionId: string | null
): Promise<RateLimitResult> {
  const key = userId ? `user:${userId}:challenges` : `session:${sessionId}:challenges`;
  const limit = 30;
  const windowSeconds = 60 * 60; // 1 hour

  return checkRateLimit(key, limit, windowSeconds);
}
