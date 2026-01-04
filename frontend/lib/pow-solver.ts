/**
 * Proof-of-Work Solver Utility
 * Client-side SHA-256 hash computation for spam prevention
 */

import type { PowChallengeResponse } from '@/shared/api-types';
import { fetchApi } from './api';

// Use the shared API type for consistency
type PowChallenge = PowChallengeResponse;

export interface PowSolution {
  challengeId: string;
  solution: string;
  solutionNonce: number; // Added for backend verification
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
): Promise<{ solution: string; solutionNonce: number }> {
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
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // Check if hash meets difficulty requirement
    if (hashHex.startsWith(targetPrefix)) {
      return { solution: hashHex, solutionNonce };
    }

    // Report progress every 1000 attempts
    if (onProgress && attempts % 1000 === 0) {
      const elapsedMs = Date.now() - startTime;
      const attemptsPerMs = attempts / elapsedMs;
      const estimatedTotalAttempts = 16 ** difficulty;
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
 * @returns The challenge
 */
export async function requestPowChallenge(resource: string): Promise<PowChallenge> {
  const response = await fetchApi<{
    challengeId: string;
    nonce: string;
    difficulty: number;
    expiresAt: string;
  }>('/pow/challenge', {
    method: 'POST',
    body: JSON.stringify({ resource }),
  });

  if (!response.success || !response.data) {
    throw new Error(response.error?.message || 'Failed to request PoW challenge');
  }

  return response.data;
}
