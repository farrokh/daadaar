import type { Request, Response } from 'express';
import { contentReports } from '../../../database/schema';
import type {
  CreateContentReportRequest,
  CreateContentReportResponse,
} from '../../../shared/api-types';
import type { ApiResponse } from '../../../shared/types';
import { db } from '../db';
import { notifyModeratorsOfReport } from '../lib/email';
import { notifyNewContentReport } from '../lib/slack';

/**
 * Create a new content report
 * POST /api/content-reports
 */
export async function createContentReport(
  req: Request,
  res: Response<ApiResponse<CreateContentReportResponse>>
): Promise<void> {
  try {
    const { contentType, contentId, reason, description } = req.body as CreateContentReportRequest;

    // Validate required fields
    if (!contentType || !contentId || !reason) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'contentType, contentId, and reason are required',
        },
      });
      return;
    }

    // Get user or session from request
    const userId = req.currentUser?.type === 'registered' ? req.currentUser.id : null;
    const sessionId = req.currentUser?.type === 'anonymous' ? req.currentUser.sessionId : null;

    // Create the content report
    const [contentReport] = await db
      .insert(contentReports)
      .values({
        contentType,
        contentId,
        reporterUserId: userId,
        reporterSessionId: sessionId,
        reason,
        description: description || null,
        status: 'pending',
      })
      .returning({ id: contentReports.id });

    res.status(201).json({
      success: true,
      data: {
        contentReportId: contentReport.id,
      },
    });

    // Notify moderators (background task, don't wait for it)
    notifyModeratorsOfReport({
      id: contentReport.id,
      contentType,
      contentId,
      reason,
      description,
    }).catch((err: unknown) => {
      console.error('Failed to notify moderators about new report:', err);
    });

    // Notify Slack (background task)
    notifyNewContentReport({
      id: contentReport.id,
      contentType,
      contentId,
      reason,
      description,
    }).catch((err: unknown) => {
      console.error('Failed to send Slack notification for new report:', err);
    });
  } catch (error) {
    console.error('Error creating content report:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to create content report',
      },
    });
  }
}
