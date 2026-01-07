// Share controller
// Handles shareable link endpoints using UUIDs instead of sequential IDs

import { and, desc, eq } from 'drizzle-orm';
import type { Request, Response } from 'express';
import { db, schema } from '../db';
import { generatePresignedGetUrl } from '../lib/s3-client';

/**
 * GET /api/share/org/:uuid
 * Get organization by shareable UUID
 */
export async function getOrganizationByUuid(req: Request, res: Response) {
  try {
    const { uuid } = req.params;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(uuid)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_UUID',
          message: 'Invalid UUID format',
        },
      });
    }

    const [organization] = await db
      .select()
      .from(schema.organizations)
      .where(eq(schema.organizations.shareableUuid, uuid));

    if (!organization) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Organization not found',
        },
      });
    }

    // Generate presigned URL for logo
    if (organization.logoUrl && !organization.logoUrl.startsWith('http')) {
      organization.logoUrl = await generatePresignedGetUrl(organization.logoUrl);
    }

    // Fetch members with roles
    const members = await db
      .select({
        id: schema.individuals.id,
        shareableUuid: schema.individuals.shareableUuid,
        fullName: schema.individuals.fullName,
        fullNameEn: schema.individuals.fullNameEn,
        profileImageUrl: schema.individuals.profileImageUrl,
        roleTitle: schema.roles.title,
        roleTitleEn: schema.roles.titleEn,
      })
      .from(schema.individuals)
      .innerJoin(schema.roleOccupancy, eq(schema.individuals.id, schema.roleOccupancy.individualId))
      .innerJoin(schema.roles, eq(schema.roleOccupancy.roleId, schema.roles.id))
      .where(eq(schema.roles.organizationId, organization.id))
      .limit(50);

    // Sign member image URLs
    const membersWithSignedUrls = await Promise.all(
      members.map(async member => {
        if (member.profileImageUrl && !member.profileImageUrl.startsWith('http')) {
          return {
            ...member,
            profileImageUrl: await generatePresignedGetUrl(member.profileImageUrl),
          };
        }
        return member;
      })
    );

    // biome-ignore lint/suspicious/noExplicitAny: Extending inferred type with members
    (organization as any).members = membersWithSignedUrls;

    res.json({
      success: true,
      data: organization,
    });
  } catch (error) {
    console.error('Error getting organization by UUID:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get organization',
      },
    });
  }
}

/**
 * GET /api/share/individual/:uuid
 * Get individual by shareable UUID
 */
export async function getIndividualByUuid(req: Request, res: Response) {
  try {
    const { uuid } = req.params;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(uuid)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_UUID',
          message: 'Invalid UUID format',
        },
      });
    }

    const [individual] = await db
      .select()
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

    // Generate presigned URL for profile image
    if (individual.profileImageUrl && !individual.profileImageUrl.startsWith('http')) {
      individual.profileImageUrl = await generatePresignedGetUrl(individual.profileImageUrl);
    }

    // Fetch related reports
    const individualReports = await db
      .select({
        id: schema.reports.id,
        shareableUuid: schema.reports.shareableUuid,
        title: schema.reports.title,
        titleEn: schema.reports.titleEn,
        incidentDate: schema.reports.incidentDate,
        createdAt: schema.reports.createdAt,
      })
      .from(schema.reports)
      .innerJoin(schema.reportLinks, eq(schema.reports.id, schema.reportLinks.reportId))
      .where(
        and(
          eq(schema.reportLinks.individualId, individual.id),
          eq(schema.reports.isPublished, true),
          eq(schema.reports.isDeleted, false)
        )
      )
      .orderBy(desc(schema.reports.incidentDate))
      .limit(20);

    // biome-ignore lint/suspicious/noExplicitAny: Extending inferred type with reports
    (individual as any).reports = individualReports;

    res.json({
      success: true,
      data: individual,
    });
  } catch (error) {
    console.error('Error getting individual by UUID:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get individual',
      },
    });
  }
}

/**
 * GET /api/share/report/:uuid
 * Get report by shareable UUID
 */
export async function getReportByUuid(req: Request, res: Response) {
  try {
    const { uuid } = req.params;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(uuid)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_UUID',
          message: 'Invalid UUID format',
        },
      });
    }

    const [report] = await db
      .select()
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

    // Only return published reports
    if (!report.isPublished || report.isDeleted) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Report not found',
        },
      });
    }

    // Fetch media
    const mediaItems = await db
      .select()
      .from(schema.media)
      .where(and(eq(schema.media.reportId, report.id), eq(schema.media.isDeleted, false)));

    // Sign media URLs
    const mediaWithUrls = await Promise.all(
      mediaItems.map(async item => {
        if (item.s3Key) {
          const url = await generatePresignedGetUrl(item.s3Key);
          return { ...item, url };
        }
        return item;
      })
    );

    // biome-ignore lint/suspicious/noExplicitAny: Extending inferred type with media
    (report as any).media = mediaWithUrls;

    res.json({
      success: true,
      data: report,
    });
  } catch (error) {
    console.error('Error getting report by UUID:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get report',
      },
    });
  }
}

/**
 * GET /api/share/user/:uuid
 * Get user public profile by shareable UUID
 */
export async function getUserByUuid(req: Request, res: Response) {
  try {
    const { uuid } = req.params;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(uuid)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_UUID',
          message: 'Invalid UUID format',
        },
      });
    }

    const [user] = await db
      .select({
        id: schema.users.id,
        shareableUuid: schema.users.shareableUuid,
        username: schema.users.username,
        displayName: schema.users.displayName,
        profileImageUrl: schema.users.profileImageUrl,
        createdAt: schema.users.createdAt,
      })
      .from(schema.users)
      .where(eq(schema.users.shareableUuid, uuid));

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'User not found',
        },
      });
    }

    // Generate presigned URL for profile image
    if (user.profileImageUrl && !user.profileImageUrl.startsWith('http')) {
      user.profileImageUrl = await generatePresignedGetUrl(user.profileImageUrl);
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Error getting user by UUID:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get user',
      },
    });
  }
}
