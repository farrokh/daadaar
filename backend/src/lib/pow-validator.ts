import { createHash } from 'node:crypto';
import { and, eq } from 'drizzle-orm';
import { db, schema } from '../db';

/**
 * Validate a proof-of-work solution
 * @param challengeId - The challenge ID
 * @param solution - The solution hash to validate
 * @param solutionNonce - The nonce that was used to generate the solution
 * @returns true if valid, false otherwise
 */
export async function validatePowSolution(
  challengeId: string,
  solution: string,
  solutionNonce: number
): Promise<{ valid: boolean; error?: string }> {
  try {
    // 1. Fetch challenge from database
    const challenge = await db.query.powChallenges.findFirst({
      where: eq(schema.powChallenges.id, challengeId),
    });

    if (!challenge) {
      return { valid: false, error: 'Challenge not found' };
    }

    // 2. Check if challenge has expired
    if (new Date() > challenge.expiresAt) {
      return { valid: false, error: 'Challenge expired' };
    }

    // 3. Validate the solution hash format
    if (!/^[0-9a-f]{64}$/i.test(solution)) {
      return { valid: false, error: 'Invalid solution format' };
    }

    // 4. Recompute the hash to verify it was computed correctly
    const expectedHash = createHash('sha256')
      .update(`${challenge.nonce}${solutionNonce}`)
      .digest('hex')
      .toLowerCase();

    // Normalize solution to lowercase for case-insensitive comparison
    const normalizedSolution = solution.toLowerCase();

    if (expectedHash !== normalizedSolution) {
      return { valid: false, error: 'Invalid solution: hash mismatch' };
    }

    // 6. Verify the hash meets difficulty requirement
    const expectedPrefix = '0'.repeat(challenge.difficulty);
    if (!normalizedSolution.startsWith(expectedPrefix)) {
      return { valid: false, error: 'Invalid solution: insufficient leading zeros' };
    }

    // 7. Atomically mark challenge as used (only if not already used)
    const updateResult = await db
      .update(schema.powChallenges)
      .set({ isUsed: true })
      .where(and(eq(schema.powChallenges.id, challengeId), eq(schema.powChallenges.isUsed, false)))
      .returning();

    // If no rows were updated, the challenge was already used
    if (updateResult.length === 0) {
      return { valid: false, error: 'Challenge already used' };
    }

    return { valid: true };
  } catch (error) {
    console.error('PoW validation error:', error);
    return { valid: false, error: 'Validation failed' };
  }
}

/**
 * Verify a hash has the required number of leading zeros
 * @param hash - The hash to check
 * @param difficulty - Number of leading zeros required
 * @returns true if valid
 */
export function verifyHashDifficulty(hash: string, difficulty: number): boolean {
  const prefix = '0'.repeat(difficulty);
  return hash.startsWith(prefix);
}

/**
 * Generate a SHA-256 hash
 * @param data - Data to hash
 * @returns hex-encoded hash
 */
export function generateHash(data: string): string {
  return createHash('sha256').update(data).digest('hex');
}
