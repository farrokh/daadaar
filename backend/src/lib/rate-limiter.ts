import { redis } from './redis';

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  error?: string;
}

/**
 * Check if a user/session has exceeded the rate limit
 * @param key - Unique identifier (userId or sessionId)
 * @param limit - Maximum number of requests allowed
 * @param windowSeconds - Time window in seconds
 * @returns Rate limit result
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  if (!redis) {
    // If Redis is not available, allow the request (development mode)
    console.warn('Redis not available, skipping rate limit check');
    return {
      allowed: true,
      remaining: limit,
      resetAt: new Date(Date.now() + windowSeconds * 1000),
    };
  }

  try {
    const rateLimitKey = `ratelimit:${key}`;
    
    // Get current count
    const currentCount = await redis.get(rateLimitKey);
    const count = currentCount ? Number.parseInt(currentCount, 10) : 0;

    // Get TTL to calculate reset time
    const ttl = await redis.ttl(rateLimitKey);
    const resetAt = new Date(Date.now() + (ttl > 0 ? ttl * 1000 : windowSeconds * 1000));

    // Check if limit exceeded
    if (count >= limit) {
      return {
        allowed: false,
        remaining: 0,
        resetAt,
        error: `Rate limit exceeded. Try again after ${resetAt.toISOString()}`,
      };
    }

    // Increment counter
    if (count === 0) {
      // First request in window, set with expiration
      await redis.set(rateLimitKey, '1', 'EX', windowSeconds);
    } else {
      // Increment existing counter
      await redis.incr(rateLimitKey);
    }

    return {
      allowed: true,
      remaining: limit - count - 1,
      resetAt,
    };
  } catch (error) {
    console.error('Rate limit check error:', error);
    // On error, allow the request but log the issue
    return {
      allowed: true,
      remaining: limit,
      resetAt: new Date(Date.now() + windowSeconds * 1000),
    };
  }
}

/**
 * Check report submission rate limit
 * 5 reports per hour per user/session
 */
export async function checkReportSubmissionLimit(
  userId: number | null,
  sessionId: string | null
): Promise<RateLimitResult> {
  const key = userId ? `user:${userId}:reports` : `session:${sessionId}:reports`;
  const limit = 5;
  const windowSeconds = 60 * 60; // 1 hour

  return checkRateLimit(key, limit, windowSeconds);
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
