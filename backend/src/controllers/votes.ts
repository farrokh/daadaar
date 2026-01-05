import { type SQL, and, eq, or, sql } from 'drizzle-orm';
import type { Request, Response } from 'express';
import { db, schema } from '../db';
import { validatePowSolution } from '../lib/pow-validator';
import { checkVotingLimit } from '../lib/rate-limiter';

interface CastVoteBody {
  reportId: number;
  voteType: 'upvote' | 'downvote';
  // PoW is required for anonymous users only
  powChallengeId?: string;
  powSolution?: string;
  powSolutionNonce?: number;
}

/**
 * Cast a vote on a report (upvote or downvote)
 * POST /api/votes
 *
 * Supports:
 * - Voting (creates new vote)
 * - Vote changes (upvote -> downvote or vice versa)
 * - Duplicate prevention (unique constraints)
 * - PoW validation for anonymous users
 * - Atomic vote count updates
 */
export async function castVote(req: Request, res: Response) {
  try {
    const body = req.body as CastVoteBody;

    // Validate required fields
    if (!body.reportId || !body.voteType) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_FIELDS',
          message: 'Missing required fields: reportId, voteType',
        },
      });
    }

    // Validate voteType enum
    if (body.voteType !== 'upvote' && body.voteType !== 'downvote') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_VOTE_TYPE',
          message: 'voteType must be either "upvote" or "downvote"',
        },
      });
    }

    // Get user/session info
    const userId = req.currentUser?.type === 'registered' ? req.currentUser.id : null;
    const sessionId = req.currentUser?.type === 'anonymous' ? req.currentUser.sessionId : null;

    // Anonymous users must provide PoW
    if (!userId) {
      if (!body.powChallengeId || !body.powSolution || body.powSolutionNonce === undefined) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'POW_REQUIRED',
            message:
              'Anonymous users must provide PoW: powChallengeId, powSolution, powSolutionNonce',
          },
        });
      }

      // Validate PoW solution
      const powValidation = await validatePowSolution(
        body.powChallengeId,
        body.powSolution,
        body.powSolutionNonce
      );

      if (!powValidation.valid) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_POW',
            message: powValidation.error || 'Invalid proof-of-work solution',
          },
        });
      }
    }

    // Check rate limit
    const rateLimit = await checkVotingLimit(userId, sessionId);
    if (!rateLimit.allowed) {
      return res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: rateLimit.error,
          details: {
            resetAt: rateLimit.resetAt.toISOString(),
          },
        },
      });
    }

    // Verify report exists
    const report = await db.query.reports.findFirst({
      where: and(
        eq(schema.reports.id, body.reportId),
        eq(schema.reports.isPublished, true),
        eq(schema.reports.isDeleted, false)
      ),
    });

    if (!report) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'REPORT_NOT_FOUND',
          message: 'Report not found',
        },
      });
    }

    // Check for existing vote
    let whereClause: SQL | undefined;
    if (userId) {
      whereClause = and(eq(schema.votes.reportId, body.reportId), eq(schema.votes.userId, userId));
    } else if (sessionId) {
      whereClause = and(
        eq(schema.votes.reportId, body.reportId),
        eq(schema.votes.sessionId, sessionId)
      );
    } else {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required to vote',
        },
      });
    }

    const existingVote = await db.query.votes.findFirst({
      where: whereClause,
    });

    // Execute vote in a transaction (for atomic count updates)
    const result = await db.transaction(async tx => {
      let voteAction: 'created' | 'updated' | 'unchanged' = 'created';
      let vote: typeof existingVote;

      if (existingVote) {
        // Vote exists - check if it's the same type
        if (existingVote.voteType === body.voteType) {
          // Same vote type - no change needed
          voteAction = 'unchanged';
          vote = existingVote;
        } else {
          // Different vote type - update the vote
          voteAction = 'updated';
          const [updatedVote] = await tx
            .update(schema.votes)
            .set({
              voteType: body.voteType,
              updatedAt: new Date(),
            })
            .where(eq(schema.votes.id, existingVote.id))
            .returning();
          vote = updatedVote;

          // Atomic update: decrement old vote type, increment new vote type
          if (existingVote.voteType === 'upvote') {
            // Was upvote, now downvote
            await tx
              .update(schema.reports)
              .set({
                upvoteCount: sql`${schema.reports.upvoteCount} - 1`,
                downvoteCount: sql`${schema.reports.downvoteCount} + 1`,
                updatedAt: new Date(),
              })
              .where(eq(schema.reports.id, body.reportId));
          } else {
            // Was downvote, now upvote
            await tx
              .update(schema.reports)
              .set({
                upvoteCount: sql`${schema.reports.upvoteCount} + 1`,
                downvoteCount: sql`${schema.reports.downvoteCount} - 1`,
                updatedAt: new Date(),
              })
              .where(eq(schema.reports.id, body.reportId));
          }
        }
      } else {
        // No existing vote - create new vote
        const [newVote] = await tx
          .insert(schema.votes)
          .values({
            reportId: body.reportId,
            userId,
            sessionId,
            voteType: body.voteType,
          })
          .returning();
        vote = newVote;

        // Atomic update: increment vote count
        if (body.voteType === 'upvote') {
          await tx
            .update(schema.reports)
            .set({
              upvoteCount: sql`${schema.reports.upvoteCount} + 1`,
              updatedAt: new Date(),
            })
            .where(eq(schema.reports.id, body.reportId));
        } else {
          await tx
            .update(schema.reports)
            .set({
              downvoteCount: sql`${schema.reports.downvoteCount} + 1`,
              updatedAt: new Date(),
            })
            .where(eq(schema.reports.id, body.reportId));
        }
      }

      // Fetch updated report vote counts inside transaction for consistency
      const updatedReport = await tx.query.reports.findFirst({
        where: eq(schema.reports.id, body.reportId),
        columns: {
          id: true,
          upvoteCount: true,
          downvoteCount: true,
        },
      });

      return {
        vote,
        voteAction,
        reportVoteCounts: {
          upvoteCount: updatedReport?.upvoteCount || 0,
          downvoteCount: updatedReport?.downvoteCount || 0,
        },
      };
    });

    return res.status(result.voteAction === 'created' ? 201 : 200).json({
      success: true,
      data: {
        vote: result.vote,
        voteAction: result.voteAction,
        reportVoteCounts: result.reportVoteCounts,
      },
    });
  } catch (error) {
    console.error('Cast vote error:', error);

    // Handle unique constraint violation (should not happen due to checks, but defensive)
    if (error instanceof Error && 'code' in error && error.code === '23505') {
      return res.status(409).json({
        success: false,
        error: {
          code: 'DUPLICATE_VOTE',
          message: 'You have already voted on this report',
        },
      });
    }

    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to cast vote',
      },
    });
  }
}

interface RemoveVoteBody {
  // PoW is required for anonymous users only
  powChallengeId?: string;
  powSolution?: string;
  powSolutionNonce?: number;
}

/**
 * Remove a vote from a report
 * DELETE /api/votes/:reportId
 *
 * Supports:
 * - Vote removal (deletes existing vote)
 * - PoW validation for anonymous users
 * - Atomic vote count updates
 */
export async function removeVote(req: Request, res: Response) {
  try {
    const reportId = Number.parseInt(req.params.reportId, 10);
    const body = req.body as RemoveVoteBody;

    if (Number.isNaN(reportId)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ID',
          message: 'Invalid report ID',
        },
      });
    }

    // Get user/session info
    const userId = req.currentUser?.type === 'registered' ? req.currentUser.id : null;
    const sessionId = req.currentUser?.type === 'anonymous' ? req.currentUser.sessionId : null;

    // Anonymous users must provide PoW
    if (!userId) {
      if (!body.powChallengeId || !body.powSolution || body.powSolutionNonce === undefined) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'POW_REQUIRED',
            message:
              'Anonymous users must provide PoW: powChallengeId, powSolution, powSolutionNonce',
          },
        });
      }

      // Validate PoW solution
      const powValidation = await validatePowSolution(
        body.powChallengeId,
        body.powSolution,
        body.powSolutionNonce
      );

      if (!powValidation.valid) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_POW',
            message: powValidation.error || 'Invalid proof-of-work solution',
          },
        });
      }
    }

    // Build where clause for finding the vote
    let whereClause: SQL | undefined;
    if (userId) {
      whereClause = and(eq(schema.votes.reportId, reportId), eq(schema.votes.userId, userId));
    } else if (sessionId) {
      whereClause = and(eq(schema.votes.reportId, reportId), eq(schema.votes.sessionId, sessionId));
    } else {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required to remove vote',
        },
      });
    }

    // Remove vote and update counts atomically
    // All reads and writes happen inside the transaction to prevent race conditions
    const result = await db.transaction(async tx => {
      // Find existing vote inside the transaction
      const existingVote = await tx.query.votes.findFirst({
        where: whereClause,
      });

      if (!existingVote) {
        return { success: false, notFound: true };
      }

      // Delete the vote
      await tx.delete(schema.votes).where(eq(schema.votes.id, existingVote.id));

      // Decrement the appropriate vote count using SQL arithmetic
      if (existingVote.voteType === 'upvote') {
        await tx
          .update(schema.reports)
          .set({
            upvoteCount: sql`${schema.reports.upvoteCount} - 1`,
            updatedAt: new Date(),
          })
          .where(eq(schema.reports.id, reportId));
      } else {
        await tx
          .update(schema.reports)
          .set({
            downvoteCount: sql`${schema.reports.downvoteCount} - 1`,
            updatedAt: new Date(),
          })
          .where(eq(schema.reports.id, reportId));
      }

      // Fetch updated report vote counts inside transaction for consistency
      const updatedReport = await tx.query.reports.findFirst({
        where: eq(schema.reports.id, reportId),
        columns: {
          id: true,
          upvoteCount: true,
          downvoteCount: true,
        },
      });

      return {
        success: true,
        notFound: false,
        reportVoteCounts: {
          upvoteCount: updatedReport?.upvoteCount || 0,
          downvoteCount: updatedReport?.downvoteCount || 0,
        },
      };
    });

    // Check if vote was not found
    if (result.notFound) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'VOTE_NOT_FOUND',
          message: 'You have not voted on this report',
        },
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        reportVoteCounts: result.reportVoteCounts,
      },
    });
  } catch (error) {
    console.error('Remove vote error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to remove vote',
      },
    });
  }
}

/**
 * Get the current user's vote on a report
 * GET /api/votes/:reportId/my-vote
 */
export async function getMyVote(req: Request, res: Response) {
  try {
    const reportId = Number.parseInt(req.params.reportId, 10);

    if (Number.isNaN(reportId)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ID',
          message: 'Invalid report ID',
        },
      });
    }

    // Get user/session info
    const userId = req.currentUser?.type === 'registered' ? req.currentUser.id : null;
    const sessionId = req.currentUser?.type === 'anonymous' ? req.currentUser.sessionId : null;

    // Construct where clause based on user authentication
    let whereClause: SQL | undefined;
    if (userId) {
      whereClause = and(eq(schema.votes.reportId, reportId), eq(schema.votes.userId, userId));
    } else if (sessionId) {
      whereClause = and(eq(schema.votes.reportId, reportId), eq(schema.votes.sessionId, sessionId));
    } else {
      // No user/session identified - guest cannot have a vote
      return res.status(200).json({
        success: true,
        data: {
          vote: null,
        },
      });
    }

    // Find existing vote
    const vote = await db.query.votes.findFirst({
      where: whereClause,
    });

    return res.status(200).json({
      success: true,
      data: {
        vote: vote || null,
      },
    });
  } catch (error) {
    console.error('Get my vote error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch vote',
      },
    });
  }
}
