/**
 * Proof-of-Work Solver Utility
 * Client-side SHA-256 hash computation for spam prevention
 */

export interface PowChallenge {
  challengeId: string;
  nonce: string;
  difficulty: number;
  expiresAt: string;
}

export interface PowSolution {
  challengeId: string;
  solution: string;
}

export interface PowProgress {
  attempts: number;
  estimatedTimeMs: number;
  progress: number; // 0-100
}

/**
 * Solve a proof-of-work challenge
 * @param challenge - The PoW challenge from the server
 * @param onProgress - Optional callback for progress updates
 * @returns The solution hash
 */
export async function solvePowChallenge(
  challenge: PowChallenge,
  onProgress?: (progress: PowProgress) => void
): Promise<string> {
  const { nonce, difficulty } = challenge;
  const targetPrefix = '0'.repeat(difficulty);
  const startTime = Date.now();

  let attempts = 0;
  const maxAttempts = 10_000_000; // Prevent infinite loops

  // Use Web Crypto API for SHA-256 hashing
  const encoder = new TextEncoder();

  for (let solutionNonce = 0; solutionNonce < maxAttempts; solutionNonce++) {
    attempts++;

    // Compute hash of nonce + solutionNonce
    const data = `${nonce}${solutionNonce}`;
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(data));
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

    // Check if hash meets difficulty requirement
    if (hashHex.startsWith(targetPrefix)) {
      return hashHex;
    }

    // Report progress every 1000 attempts
    if (onProgress && attempts % 1000 === 0) {
      const elapsedMs = Date.now() - startTime;
      const attemptsPerMs = attempts / elapsedMs;
      const estimatedTotalAttempts = Math.pow(16, difficulty);
      const estimatedTimeMs = estimatedTotalAttempts / attemptsPerMs;
      const progress = Math.min((attempts / estimatedTotalAttempts) * 100, 99);

      onProgress({
        attempts,
        estimatedTimeMs,
        progress,
      });
    }
  }

  throw new Error('Failed to solve PoW challenge: max attempts reached');
}

/**
 * Request a PoW challenge from the server
 * @param resource - The resource type (e.g., 'report-submission')
 * @param apiUrl - The API base URL
 * @returns The challenge
 */
export async function requestPowChallenge(
  resource: string,
  apiUrl: string
): Promise<PowChallenge> {
  const response = await fetch(`${apiUrl}/api/pow/challenge`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ resource }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to request PoW challenge');
  }

  const data = await response.json();
  return data.data;
}
