import type { Request, Response } from 'express';
import { randomBytes } from 'node:crypto';
import { db, schema } from '../db';

/**
 * Generate a new proof-of-work challenge
 * POST /api/pow/challenge
 */
export async function generateChallenge(req: Request, res: Response) {
  try {
    const { resource } = req.body as { resource?: string };

    // Validate resource type
    const validResources = ['report-submission', 'voting'];
    if (!resource || !validResources.includes(resource)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_RESOURCE',
          message: 'Invalid or missing resource type',
          validResources,
        },
      });
    }

    // Determine difficulty based on resource type
    // Report submission: 4-6 leading zeros (1-5 seconds)
    // Voting: 2-3 leading zeros (0.5-2 seconds) - for anonymous users only
    const difficulty = resource === 'report-submission' ? 5 : 3;

    // Generate random nonce
    const nonce = randomBytes(32).toString('hex');

    // Set expiration (5 minutes)
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    // Get user/session info from auth middleware
    const userId = req.currentUser?.type === 'registered' ? req.currentUser.id : null;
    const sessionId = req.currentUser?.type === 'anonymous' ? req.currentUser.sessionId : null;

    // Create challenge in database
    const [challenge] = await db
      .insert(schema.powChallenges)
      .values({
        sessionId,
        userId,
        resource,
        difficulty,
        nonce,
        isUsed: false,
        expiresAt,
      })
      .returning();

    return res.status(200).json({
      success: true,
      data: {
        challengeId: challenge.id,
        nonce: challenge.nonce,
        difficulty: challenge.difficulty,
        expiresAt: challenge.expiresAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Generate PoW challenge error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to generate challenge',
      },
    });
  }
}
