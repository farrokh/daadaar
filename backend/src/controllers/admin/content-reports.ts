import { and, count, desc, eq, sql } from 'drizzle-orm';
import type { Request, Response } from 'express';
import { db, schema } from '../../db';

/**
 * GET /api/admin/content-reports
 * List all content reports with filtering and pagination
 */
export async function listContentReports(req: Request, res: Response) {
  try {
    const status = req.query.status as string;
    const contentType = req.query.contentType as string;
    const reason = req.query.reason as string;
    const page = Number.parseInt(req.query.page as string) || 1;
    const limit = Number.parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    const where = [];
    if (status) {
      where.push(
        eq(
          schema.contentReports.status,
          status as 'pending' | 'reviewing' | 'resolved' | 'dismissed'
        )
      );
    }
    if (contentType) {
      where.push(
        eq(
          schema.contentReports.contentType,
          contentType as 'report' | 'organization' | 'individual' | 'user' | 'media'
        )
      );
    }
    if (reason) {
      where.push(
        eq(
          schema.contentReports.reason,
          reason as
            | 'spam'
            | 'misinformation'
            | 'harassment'
            | 'inappropriate'
            | 'duplicate'
            | 'other'
        )
      );
    }

    const queryWhere = where.length > 0 ? and(...where) : undefined;

    const reports = await db.query.contentReports.findMany({
      where: queryWhere,
      orderBy: [desc(schema.contentReports.createdAt)],
      limit,
      offset,
      with: {
        reporter: {
          columns: {
            id: true,
            username: true,
            displayName: true,
          },
        },
        reviewer: {
          columns: {
            id: true,
            username: true,
            displayName: true,
          },
        },
      },
    });

    // Post-process to get content details
    const contentIdsByType: Record<string, number[]> = {};
    for (const r of reports) {
      if (!contentIdsByType[r.contentType]) {
        contentIdsByType[r.contentType] = [];
      }
      contentIdsByType[r.contentType].push(r.contentId);
    }

    const contentDetails: Record<string, Record<number, { title: string; subtitle?: string }>> = {};

    // Fetch Organizations
    if (contentIdsByType.organization?.length) {
      const orgs = await db.query.organizations.findMany({
        where: (orgs, { inArray }) => inArray(orgs.id, contentIdsByType.organization),
        columns: { id: true, name: true, nameEn: true },
      });
      contentDetails.organization = {};
      for (const o of orgs) {
        contentDetails.organization[o.id] = { title: o.nameEn || o.name, subtitle: o.name };
      }
    }

    // Fetch Individuals
    if (contentIdsByType.individual?.length) {
      const inds = await db.query.individuals.findMany({
        where: (inds, { inArray }) => inArray(inds.id, contentIdsByType.individual),
        columns: { id: true, fullName: true, fullNameEn: true },
      });
      contentDetails.individual = {};
      for (const i of inds) {
        contentDetails.individual[i.id] = {
          title: i.fullNameEn || i.fullName,
          subtitle: i.fullName,
        };
      }
    }

    // Fetch Reports
    if (contentIdsByType.report?.length) {
      const reps = await db.query.reports.findMany({
        where: (reps, { inArray }) => inArray(reps.id, contentIdsByType.report),
        columns: { id: true, title: true, titleEn: true },
      });
      contentDetails.report = {};
      for (const r of reps) {
        contentDetails.report[r.id] = { title: r.titleEn || r.title, subtitle: r.title };
      }
    }

    // Fetch Users
    if (contentIdsByType.user?.length) {
      const usrs = await db.query.users.findMany({
        where: (usrs, { inArray }) => inArray(usrs.id, contentIdsByType.user),
        columns: { id: true, username: true, displayName: true },
      });
      contentDetails.user = {};
      for (const u of usrs) {
        contentDetails.user[u.id] = {
          title: u.displayName || u.username,
          subtitle: `@${u.username}`,
        };
      }
    }

    // Map details back to reports
    const reportsWithDetails = reports.map((r: (typeof reports)[number]) => ({
      ...r,
      contentDetails: contentDetails[r.contentType]?.[r.contentId] || null,
    }));

    const [totalCount] = await db
      .select({ count: count() })
      .from(schema.contentReports)
      .where(queryWhere);

    res.json({
      success: true,
      data: {
        reports: reportsWithDetails,
        pagination: {
          total: totalCount.count,
          page,
          limit,
          totalPages: Math.ceil(totalCount.count / limit),
        },
      },
    });
  } catch (error) {
    console.error('Error listing content reports:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to list content reports' },
    });
  }
}

/**
 * GET /api/admin/content-reports/:id
 * Get detailed view of a single content report
 */
export async function getContentReport(req: Request, res: Response) {
  try {
    const id = Number.parseInt(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_ID', message: 'Invalid report ID' },
      });
    }

    const report = await db.query.contentReports.findFirst({
      where: eq(schema.contentReports.id, id),
      with: {
        reporter: {
          columns: {
            id: true,
            username: true,
            displayName: true,
          },
        },
        reviewer: {
          columns: {
            id: true,
            username: true,
            displayName: true,
          },
        },
      },
    });

    if (!report) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Content report not found' },
      });
    }

    res.json({
      success: true,
      data: report,
    });
  } catch (error) {
    console.error('Error getting content report:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to get content report' },
    });
  }
}

/**
 * PATCH /api/admin/content-reports/:id/status
 * Update the status of a content report
 */
export async function updateContentReportStatus(req: Request, res: Response) {
  try {
    const id = Number.parseInt(req.params.id);
    const { status, adminNotes } = req.body;

    if (Number.isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_ID', message: 'Invalid report ID' },
      });
    }

    const validStatuses = ['pending', 'reviewing', 'resolved', 'dismissed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_STATUS', message: 'Invalid status value' },
      });
    }

    const reviewerId = req.currentUser?.type === 'registered' ? req.currentUser.id : null;

    const [updatedReport] = await db
      .update(schema.contentReports)
      .set({
        status: status as 'pending' | 'reviewing' | 'resolved' | 'dismissed',
        adminNotes: adminNotes || null,
        reviewedByUserId: status !== 'pending' ? reviewerId : null,
        reviewedAt: status !== 'pending' ? new Date() : null,
        updatedAt: new Date(),
      })
      .where(eq(schema.contentReports.id, id))
      .returning();

    if (!updatedReport) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Content report not found' },
      });
    }

    res.json({
      success: true,
      data: updatedReport,
    });
  } catch (error) {
    console.error('Error updating content report:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to update content report' },
    });
  }
}

/**
 * GET /api/admin/content-reports/stats
 * Get summary statistics for content reports
 */
export async function getContentReportStats(_req: Request, res: Response) {
  try {
    const statusStats = await db
      .select({
        status: schema.contentReports.status,
        count: count(),
      })
      .from(schema.contentReports)
      .groupBy(schema.contentReports.status);

    const typeStats = await db
      .select({
        contentType: schema.contentReports.contentType,
        count: count(),
      })
      .from(schema.contentReports)
      .groupBy(schema.contentReports.contentType);

    res.json({
      success: true,
      data: {
        byStatus: statusStats,
        byType: typeStats,
      },
    });
  } catch (error) {
    console.error('Error getting content report stats:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to get content report stats' },
    });
  }
}
