/**
 * SEO Image Generation Controller
 * Generates and caches Open Graph images for social media sharing
 */

import type { Request, Response } from 'express';
import { eq } from 'drizzle-orm';
import { db, schema } from '../db';
import {
  generateOrgSeoImage,
  generateIndividualSeoImage,
  generateReportSeoImage,
  getSeoImageUrl,
} from '../lib/seo-image-generator';

/**
 * POST /api/seo/generate-org-image/:uuid
 * Generate SEO image for an organization
 */
export async function generateOrgImage(req: Request, res: Response) {
  try {
    const { uuid } = req.params;

    // Fetch organization
    const [org] = await db
      .select({
        shareableUuid: schema.organizations.shareableUuid,
        name: schema.organizations.name,
        nameEn: schema.organizations.nameEn,
        logoUrl: schema.organizations.logoUrl,
      })
      .from(schema.organizations)
      .where(eq(schema.organizations.shareableUuid, uuid));

    if (!org) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Organization not found',
        },
      });
    }

    // Use English name if available, otherwise fallback to main name
    const displayName = org.nameEn || org.name;

    // Generate and upload SEO image
    const imageUrl = await generateOrgSeoImage(uuid, displayName, org.logoUrl);

    res.json({
      success: true,
      data: {
        uuid,
        imageUrl,
        entityType: 'organization',
      },
    });
  } catch (error) {
    console.error('Error generating organization SEO image:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to generate SEO image',
      },
    });
  }
}

/**
 * POST /api/seo/generate-individual-image/:uuid
 * Generate SEO image for an individual
 */
export async function generateIndividualImage(req: Request, res: Response) {
  try {
    const { uuid } = req.params;

    // Fetch individual
    const [individual] = await db
      .select({
        shareableUuid: schema.individuals.shareableUuid,
        fullName: schema.individuals.fullName,
        fullNameEn: schema.individuals.fullNameEn,
        profileImageUrl: schema.individuals.profileImageUrl,
      })
      .from(schema.individuals)
      .where(eq(schema.individuals.shareableUuid, uuid));

    if (!individual) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Individual not found',
        },
      });
    }

    const displayName = individual.fullNameEn || individual.fullName;

    // Generate and upload SEO image
    const imageUrl = await generateIndividualSeoImage(
      uuid,
      displayName,
      individual.profileImageUrl
    );

    res.json({
      success: true,
      data: {
        uuid,
        imageUrl,
        entityType: 'individual',
      },
    });
  } catch (error) {
    console.error('Error generating individual SEO image:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to generate SEO image',
      },
    });
  }
}

/**
 * POST /api/seo/generate-report-image/:uuid
 * Generate SEO image for a report
 */
export async function generateReportImage(req: Request, res: Response) {
  try {
    const { uuid } = req.params;

    // Fetch report
    const [report] = await db
      .select({
        id: schema.reports.id,
        shareableUuid: schema.reports.shareableUuid,
        title: schema.reports.title,
        titleEn: schema.reports.titleEn,
      })
      .from(schema.reports)
      .where(eq(schema.reports.shareableUuid, uuid));

    if (!report) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Report not found',
        },
      });
    }

    const displayTitle = report.titleEn || report.title;

    // Find first image from report media
    const [firstImage] = await db
      .select({
        s3Key: schema.media.s3Key,
      })
      .from(schema.media)
      .where(eq(schema.media.reportId, report.id))
      .limit(1);

    // Generate and upload SEO image
    const imageUrl = await generateReportSeoImage(
      uuid,
      displayTitle,
      firstImage?.s3Key || null
    );

    res.json({
      success: true,
      data: {
        uuid,
        imageUrl,
        entityType: 'report',
      },
    });
  } catch (error) {
    console.error('Error generating report SEO image:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to generate SEO image',
      },
    });
  }
}

/**
 * POST /api/seo/batch-generate
 * Generate SEO images for all entities (admin only)
 */
export async function batchGenerateImages(req: Request, res: Response) {
  try {
    // Check if user is admin
    if (!req.currentUser || req.currentUser.type !== 'registered') {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
    }

    const [user] = await db
      .select({ role: schema.users.role })
      .from(schema.users)
      .where(eq(schema.users.id, req.currentUser.id));

    if (!user || user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Admin access required',
        },
      });
    }

    const results = {
      organizations: { success: 0, failed: 0 },
      individuals: { success: 0, failed: 0 },
      reports: { success: 0, failed: 0 },
    };

    // Generate for all organizations
    const orgs = await db
      .select({
        shareableUuid: schema.organizations.shareableUuid,
        name: schema.organizations.name,
        nameEn: schema.organizations.nameEn,
      })
      .from(schema.organizations);

    for (const org of orgs) {
      try {
        await generateOrgSeoImage(org.shareableUuid, org.nameEn || org.name, null);
        results.organizations.success++;
      } catch (error) {
        console.error(`Failed to generate SEO image for org ${org.shareableUuid}:`, error);
        results.organizations.failed++;
      }
    }

    // Generate for all individuals
    const individuals = await db
      .select({
        shareableUuid: schema.individuals.shareableUuid,
        fullName: schema.individuals.fullName,
        fullNameEn: schema.individuals.fullNameEn,
      })
      .from(schema.individuals);

    for (const individual of individuals) {
      try {
        await generateIndividualSeoImage(
          individual.shareableUuid,
          individual.fullNameEn || individual.fullName,
          null
        );
        results.individuals.success++;
      } catch (error) {
        console.error(
          `Failed to generate SEO image for individual ${individual.shareableUuid}:`,
          error
        );
        results.individuals.failed++;
      }
    }

    // Generate for all reports
    const reports = await db
      .select({
        shareableUuid: schema.reports.shareableUuid,
        title: schema.reports.title,
        titleEn: schema.reports.titleEn,
      })
      .from(schema.reports);

    for (const report of reports) {
      try {
        await generateReportSeoImage(
          report.shareableUuid,
          report.titleEn || report.title,
          null
        );
        results.reports.success++;
      } catch (error) {
        console.error(`Failed to generate SEO image for report ${report.shareableUuid}:`, error);
        results.reports.failed++;
      }
    }

    res.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error('Error in batch generation:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to generate SEO images',
      },
    });
  }
}

/**
 * GET /api/seo/image-url/:entityType/:uuid
 * Get the SEO image URL for an entity (doesn't generate, just returns URL)
 */
export async function getSeoImage(req: Request, res: Response) {
  try {
    const { entityType, uuid } = req.params;

    if (!['org', 'individual', 'report'].includes(entityType)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid entity type. Must be org, individual, or report',
        },
      });
    }

    const imageUrl = getSeoImageUrl(entityType as 'org' | 'individual' | 'report', uuid);

    res.json({
      success: true,
      data: {
        uuid,
        entityType,
        imageUrl,
      },
    });
  } catch (error) {
    console.error('Error getting SEO image URL:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get SEO image URL',
      },
    });
  }
}
