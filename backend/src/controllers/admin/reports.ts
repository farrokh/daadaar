import { and, desc, eq, sql } from 'drizzle-orm';
import type { Request, Response } from 'express';
import { db, schema } from '../../db';
import { addVerificationJob } from '../../queues/ai-verification-queue';

/**
 * List reports for admin management
 * GET /api/admin/reports
 */
export async function listReports(req: Request, res: Response) {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const reports = await db.query.reports.findMany({
      where: eq(schema.reports.isDeleted, false),
      with: {
        aiVerification: true,
        user: {
          columns: {
            id: true,
            username: true,
            displayName: true,
          },
        },
      },
      orderBy: [desc(schema.reports.createdAt)],
      limit,
      offset,
    });

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(schema.reports)
      .where(eq(schema.reports.isDeleted, false));

    return res.json({
      success: true,
      data: {
        reports,
        pagination: {
          total: Number(count),
          page,
          limit,
          totalPages: Math.ceil(Number(count) / limit),
        },
      },
    });
  } catch (error) {
    console.error('Error listing reports for admin:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to list reports' },
    });
  }
}

/**
 * Manually trigger AI verification for a report
 * POST /api/admin/reports/:id/verify
 */
export async function triggerAiVerification(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);

    const report = await db.query.reports.findFirst({
      where: eq(schema.reports.id, id),
    });

    if (!report) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Report not found' },
      });
    }

    // Enqueue the job (ignore the feature flag for manual trigger)
    await addVerificationJob(id);

    return res.json({
      success: true,
      message: 'AI verification job enqueued successfully',
    });
  } catch (error) {
    console.error('Error triggering AI verification:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to trigger AI verification' },
    });
  }
}
