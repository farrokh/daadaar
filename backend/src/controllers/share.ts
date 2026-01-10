// Share controller
// Handles shareable link endpoints using UUIDs instead of sequential IDs

import { and, desc, eq } from 'drizzle-orm';
import type { Request, Response } from 'express';
import { db, schema } from '../db';
import { generatePresignedGetUrl } from '../lib/s3-client';

const MAX_CAREER_HISTORY = 100;

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

    // Fetch parent organization if exists
    let parentOrganization = null;
    if (organization.parentId) {
      const [parent] = await db
        .select({
          id: schema.organizations.id,
          shareableUuid: schema.organizations.shareableUuid,
          name: schema.organizations.name,
          nameEn: schema.organizations.nameEn,
        })
        .from(schema.organizations)
        .where(eq(schema.organizations.id, organization.parentId))
        .limit(1);

      if (parent) {
        parentOrganization = parent;
      }
    }

    // Fetch child organizations
    const childOrganizations = await db
      .select({
        id: schema.organizations.id,
        shareableUuid: schema.organizations.shareableUuid,
        name: schema.organizations.name,
        nameEn: schema.organizations.nameEn,
        description: schema.organizations.description,
        descriptionEn: schema.organizations.descriptionEn,
        logoUrl: schema.organizations.logoUrl,
      })
      .from(schema.organizations)
      .where(eq(schema.organizations.parentId, organization.id))
      .limit(50);

    // Sign child organization logo URLs
    const childrenWithSignedUrls = await Promise.all(
      childOrganizations.map(async child => {
        if (child.logoUrl && !child.logoUrl.startsWith('http')) {
          return {
            ...child,
            logoUrl: await generatePresignedGetUrl(child.logoUrl),
          };
        }
        return child;
      })
    );

    const organizationWithRelations = {
      ...organization,
      members: membersWithSignedUrls,
      parent: parentOrganization,
      children: childrenWithSignedUrls,
    };

    res.json({
      success: true,
      data: organizationWithRelations,
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

    // Fetch career history (role occupancies)
    const history = await db
      .select({
        id: schema.roleOccupancy.id,
        roleId: schema.roleOccupancy.roleId,
        startDate: schema.roleOccupancy.startDate,
        endDate: schema.roleOccupancy.endDate,
        roleTitle: schema.roles.title,
        roleTitleEn: schema.roles.titleEn,
        organizationId: schema.organizations.id,
        organizationName: schema.organizations.name,
        organizationNameEn: schema.organizations.nameEn,
        organizationUuid: schema.organizations.shareableUuid,
      })
      .from(schema.roleOccupancy)
      .innerJoin(schema.roles, eq(schema.roleOccupancy.roleId, schema.roles.id))
      .innerJoin(schema.organizations, eq(schema.roles.organizationId, schema.organizations.id))
      .where(eq(schema.roleOccupancy.individualId, individual.id))
      .orderBy(desc(schema.roleOccupancy.startDate))
      .limit(MAX_CAREER_HISTORY);

    const individualWithRelations = {
      ...individual,
      reports: individualReports,
      history,
    };

    res.json({
      success: true,
      data: individualWithRelations,
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

    const report = await db.query.reports.findFirst({
      columns: {
        id: true,
        shareableUuid: true,
        title: true,
        titleEn: true,
        content: true,
        contentEn: true,
        incidentDate: true,
        incidentLocation: true,
        incidentLocationEn: true,
        upvoteCount: true,
        downvoteCount: true,
        createdAt: true,
      },
      where: and(
        eq(schema.reports.shareableUuid, uuid),
        eq(schema.reports.isPublished, true),
        eq(schema.reports.isDeleted, false)
      ),
      with: {
        reportLinks: {
          with: {
            individual: {
              columns: {
                id: true,
                shareableUuid: true,
                fullName: true,
                fullNameEn: true,
                profileImageUrl: true,
              },
            },
            role: {
              columns: {
                id: true,
                title: true,
                titleEn: true,
              },
              with: {
                organization: {
                  columns: {
                    id: true,
                    shareableUuid: true,
                    name: true,
                    nameEn: true,
                    logoUrl: true,
                  },
                },
              },
            },
          },
        },
        media: {
          where: (media, { eq }) => eq(media.isDeleted, false),
        },
        user: {
          columns: {
            id: true,
            username: true,
            displayName: true,
            profileImageUrl: true,
          },
        },
        aiVerification: {
          columns: {
            confidenceScore: true,
            consistencyScore: true,
            credibilityScore: true,
            flags: true,
            createdAt: true,
          },
        },
      },
    });

    if (!report) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Report not found',
        },
      });
    }

    // Generate presigned URLs for media
    const mediaWithUrls = await Promise.all(
      report.media.map(async item => {
        let url = null;
        if (item.s3Key) {
          url = await generatePresignedGetUrl(item.s3Key, item.s3Bucket);
        }
        return {
          id: item.id,
          type: item.mediaType,
          filename: item.originalFilename,
          url,
          mimeType: item.mimeType,
          size: item.fileSizeBytes,
          createdAt: item.createdAt,
        };
      })
    );

    // Generate presigned URLs for linked individuals
    if (report.reportLinks && report.reportLinks.length > 0) {
      await Promise.all(
        report.reportLinks.map(async link => {
          if (
            link.individual?.profileImageUrl &&
            !link.individual.profileImageUrl.startsWith('http')
          ) {
            link.individual.profileImageUrl = await generatePresignedGetUrl(
              link.individual.profileImageUrl
            );
          }
        })
      );
    }

    const reportWithRelations = {
      ...report,
      media: mediaWithUrls,
    };

    res.json({
      success: true,
      data: reportWithRelations,
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
