import { and, desc, eq, gte, ilike, inArray, lte, or, sql } from 'drizzle-orm';
import type { Request, Response } from 'express';
import { db, schema } from '../db';
import { validatePowSolution } from '../lib/pow-validator';
import { checkReportSubmissionLimit } from '../lib/rate-limiter';
import { generatePresignedGetUrl } from '../lib/s3-client';
import { generateReportSeoImage } from '../lib/seo-image-generator';
import { notifyNewReport } from '../lib/slack';

/**
 * Escape special characters in a string for use in SQL LIKE patterns.
 * Escapes backslashes first, then % and _ to prevent them from being treated as wildcards.
 */
function escapeLikePattern(input: string): string {
  return input.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_');
}

interface CreateReportBody {
  title: string;
  titleEn?: string;
  content: string;
  contentEn?: string;
  incidentDate?: string;
  incidentLocation?: string;
  incidentLocationEn?: string;
  individualId: number;
  roleId?: number;
  mediaIds?: number[];
  powChallengeId: string;
  powSolution: string;
  powSolutionNonce: number; // Added for hash verification
}

/**
 * Create a new report
 * POST /api/reports
 */
export async function createReport(req: Request, res: Response) {
  try {
    const body = req.body as CreateReportBody;

    // Validate required fields
    if (
      !body.title ||
      !body.content ||
      !body.individualId ||
      !body.powChallengeId ||
      !body.powSolution ||
      body.powSolutionNonce === undefined
    ) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_FIELDS',
          message:
            'Missing required fields: title, content, individualId, powChallengeId, powSolution, powSolutionNonce',
        },
      });
    }

    // Get user/session info
    const userId = req.currentUser?.type === 'registered' ? req.currentUser.id : null;
    const sessionId = req.currentUser?.type === 'anonymous' ? req.currentUser.sessionId : null;

    // Check rate limit
    const rateLimit = await checkReportSubmissionLimit(userId, sessionId);
    if (!rateLimit.allowed) {
      return res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: rateLimit.error,
          resetAt: rateLimit.resetAt.toISOString(),
        },
      });
    }

    // Validate PoW solution with hash verification
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

    // Verify individual exists
    const individual = await db.query.individuals.findFirst({
      where: eq(schema.individuals.id, body.individualId),
    });

    if (!individual) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'INDIVIDUAL_NOT_FOUND',
          message: 'Individual not found',
        },
      });
    }

    // Verify role exists (if provided)
    if (body.roleId) {
      const role = await db.query.roles.findFirst({
        where: eq(schema.roles.id, body.roleId),
      });

      if (!role) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'ROLE_NOT_FOUND',
            message: 'Role not found',
          },
        });
      }
    }

    // Create report in a transaction
    const result = await db.transaction(async tx => {
      // 1. Create report
      const [report] = await tx
        .insert(schema.reports)
        .values({
          userId,
          sessionId,
          title: body.title,
          titleEn: body.titleEn || null,
          content: body.content,
          contentEn: body.contentEn || null,
          incidentDate: body.incidentDate ? new Date(body.incidentDate) : null,
          incidentLocation: body.incidentLocation || null,
          incidentLocationEn: body.incidentLocationEn || null,
          upvoteCount: 0,
          downvoteCount: 0,
          isPublished: true,
          isDeleted: false,
        })
        .returning();

      // 2. Create report link to individual and role
      await tx.insert(schema.reportLinks).values({
        reportId: report.id,
        individualId: body.individualId,
        roleId: body.roleId || null,
        startDate: body.incidentDate ? new Date(body.incidentDate) : null,
        endDate: null,
      });

      // 3. Associate media files with report
      if (body.mediaIds && body.mediaIds.length > 0) {
        await tx
          .update(schema.media)
          .set({ reportId: report.id })
          .where(
            and(
              inArray(schema.media.id, body.mediaIds),
              or(
                userId ? eq(schema.media.uploadedByUserId, userId) : undefined,
                sessionId ? eq(schema.media.uploadedBySessionId, sessionId) : undefined
              )
            )
          );
      }

      return report;
    });

    // Fetch complete report with associations
    const completeReport = await db.query.reports.findFirst({
      where: eq(schema.reports.id, result.id),
      with: {
        reportLinks: {
          with: {
            individual: true,
            role: {
              with: {
                organization: true,
              },
            },
          },
        },
        media: {
          where: eq(schema.media.isDeleted, false),
        },
        user: {
          columns: {
            id: true,
            username: true,
            displayName: true,
            profileImageUrl: true,
          },
        },
      },
    });

    if (completeReport) {
      // Notify Slack about new report
      notifyNewReport({
        id: completeReport.id,
        title: completeReport.title,
        author: completeReport.user?.displayName || completeReport.user?.username || 'Anonymous',
      }).catch(err => console.error('Slack notification error:', err));

      if (completeReport?.shareableUuid) {
        generateReportSeoImage(
          completeReport.shareableUuid,
          completeReport.titleEn || completeReport.title,
          completeReport.media?.[0]?.mediaType === 'image' ? completeReport.media[0].s3Key : null
        ).catch(err => console.error('SEO image generation error:', err));
      }
    }

    return res.status(201).json({
      success: true,
      data: completeReport,
    });
  } catch (error) {
    console.error('Create report error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to create report',
      },
    });
  }
}

/**
 * Get all reports with pagination and filtering
 * GET /api/reports
 */
export async function getReports(req: Request, res: Response) {
  try {
    const {
      page = '1',
      limit = '20',
      individualId,
      organizationId,
      search,
      startDate,
      endDate,
    } = req.query as Record<string, string>;

    const pageNum = Number.parseInt(page, 10);
    const limitNum = Number.parseInt(limit, 10);
    const offset = (pageNum - 1) * limitNum;

    // Build where conditions
    const conditions = [eq(schema.reports.isPublished, true), eq(schema.reports.isDeleted, false)];

    if (individualId) {
      conditions.push(
        sql`EXISTS (
          SELECT 1 FROM ${schema.reportLinks}
          WHERE ${schema.reportLinks.reportId} = ${schema.reports.id}
          AND ${schema.reportLinks.individualId} = ${Number.parseInt(individualId, 10)}
        )`
      );
    }

    if (organizationId) {
      conditions.push(
        sql`EXISTS (
          SELECT 1 FROM ${schema.reportLinks}
          JOIN ${schema.roles} ON ${schema.reportLinks.roleId} = ${schema.roles.id}
          WHERE ${schema.reportLinks.reportId} = ${schema.reports.id}
          AND ${schema.roles.organizationId} = ${Number.parseInt(organizationId, 10)}
        )`
      );
    }

    if (search) {
      const escapedSearch = escapeLikePattern(search);
      const pattern = `%${escapedSearch}%`;
      const searchCondition = or(
        ilike(schema.reports.title, pattern),
        ilike(schema.reports.content, pattern)
      );
      if (searchCondition) {
        conditions.push(searchCondition);
      }
    }

    if (startDate) {
      conditions.push(gte(schema.reports.createdAt, new Date(startDate)));
    }

    if (endDate) {
      conditions.push(lte(schema.reports.createdAt, new Date(endDate)));
    }

    // Fetch reports
    const reports = await db.query.reports.findMany({
      where: and(...conditions),
      with: {
        reportLinks: {
          with: {
            individual: true,
            role: {
              with: {
                organization: true,
              },
            },
          },
        },
        media: {
          where: eq(schema.media.isDeleted, false),
        },
        user: {
          columns: {
            id: true,
            username: true,
            displayName: true,
            profileImageUrl: true,
          },
        },
      },
      orderBy: [desc(schema.reports.createdAt)],
      limit: limitNum,
      offset,
    });

    // Generate presigned URLs for media
    const reportsWithUrls = await Promise.all(
      reports.map(async report => ({
        ...report,
        media: await Promise.all(
          report.media.map(async item => ({
            ...item,
            url: await generatePresignedGetUrl(item.s3Key, item.s3Bucket),
          }))
        ),
      }))
    );

    // Get total count
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(schema.reports)
      .where(and(...conditions));

    return res.status(200).json({
      success: true,
      data: {
        reports: reportsWithUrls,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: count,
          totalPages: Math.ceil(count / limitNum),
        },
      },
    });
  } catch (error) {
    console.error('Get reports error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch reports',
      },
    });
  }
}

/**
 * Get a single report by ID
 * GET /api/reports/:id
 */
export async function getReportById(req: Request, res: Response) {
  try {
    const reportId = Number.parseInt(req.params.id, 10);

    if (Number.isNaN(reportId)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ID',
          message: 'Invalid report ID',
        },
      });
    }

    const report = await db.query.reports.findFirst({
      where: and(
        eq(schema.reports.id, reportId),
        eq(schema.reports.isPublished, true),
        eq(schema.reports.isDeleted, false)
      ),
      with: {
        reportLinks: {
          with: {
            individual: true,
            role: {
              with: {
                organization: true,
              },
            },
          },
        },
        media: {
          where: eq(schema.media.isDeleted, false),
        },
        user: {
          columns: {
            id: true,
            username: true,
            displayName: true,
            profileImageUrl: true,
          },
        },
        votes: {
          with: {
            user: {
              columns: {
                id: true,
                username: true,
                displayName: true,
              },
            },
          },
        },
      },
    });

    if (report) {
      // Generate presigned URLs for media
      const mediaWithUrls = await Promise.all(
        report.media.map(async item => ({
          ...item,
          url: await generatePresignedGetUrl(item.s3Key, item.s3Bucket),
        }))
      );
      Object.assign(report, { media: mediaWithUrls });

      // Generate presigned URL for report author (user) profile image
      if (report.user?.profileImageUrl && !report.user.profileImageUrl.startsWith('http')) {
        const presignedUrl = await generatePresignedGetUrl(report.user.profileImageUrl);
        Object.assign(report.user, { profileImageUrl: presignedUrl });
      }

      // Generate presigned URLs for linked individuals
      if (report.reportLinks && report.reportLinks.length > 0) {
        await Promise.all(
          report.reportLinks.map(
            async (
              link: typeof schema.reportLinks.$inferSelect & {
                individual?: typeof schema.individuals.$inferSelect | null;
              }
            ) => {
              if (
                link.individual?.profileImageUrl &&
                !link.individual.profileImageUrl.startsWith('http')
              ) {
                const presignedUrl = await generatePresignedGetUrl(link.individual.profileImageUrl);
                Object.assign(link.individual, { profileImageUrl: presignedUrl });
              }
            }
          )
        );
      }
    }

    if (!report) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Report not found',
        },
      });
    }

    return res.status(200).json({
      success: true,
      data: report,
    });
  } catch (error) {
    console.error('Get report error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch report',
      },
    });
  }
}
