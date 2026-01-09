/**
 * Analytics utility functions for privacy-compliant tracking
 */

/**
 * Creates a stable, non-reversible hash of a string using SHA-256
 * This is used to anonymize PII (emails, usernames) before sending to analytics
 * @param input - The string to hash (e.g., email address)
 * @returns A hex-encoded SHA-256 hash
 */
export async function hashIdentifier(input: string): Promise<string> {
  // Use the Web Crypto API for SHA-256 hashing
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

/**
 * Sanitizes an error object for analytics, removing sensitive data
 * @param error - The error to sanitize
 * @param context - Optional context string (e.g., component name)
 * @returns A sanitized error object safe for analytics
 */
export function sanitizeError(error: unknown, context?: string): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {
    context: context || 'unknown',
  };

  if (error instanceof Error) {
    sanitized.name = error.name;
    // Truncate message to avoid leaking sensitive data
    sanitized.message = error.message.substring(0, 100);

    // Only include error code/status if present
    if ('code' in error) {
      sanitized.code = error.code;
    }
    if ('status' in error && typeof error.status === 'number') {
      sanitized.status = error.status;
    }
  } else if (typeof error === 'string') {
    sanitized.message = error.substring(0, 100);
  } else {
    sanitized.message = 'Unknown error';
  }

  // Explicitly omit stack traces and full error objects
  return sanitized;
}

/**
 * Safely calls PostHog capture with error handling
 * @param eventName - The event name
 * @param properties - Event properties
 */
export function safePosthogCapture(eventName: string, properties?: Record<string, unknown>): void {
  try {
    // Dynamic import to avoid issues if posthog isn't loaded
    // biome-ignore lint/suspicious/noExplicitAny: PostHog is loaded dynamically
    const posthog = (globalThis as any).posthog;
    if (posthog && typeof posthog.capture === 'function') {
      posthog.capture(eventName, properties);
    }
  } catch (error) {
    // Silently fail - analytics should never break the app
    console.warn('PostHog capture failed:', error);
  }
}
