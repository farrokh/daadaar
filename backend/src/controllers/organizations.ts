// Organizations controller
// Handles CRUD operations for organizations

import { count, eq, ilike } from 'drizzle-orm';
import type { Request, Response } from 'express';
import { db, schema } from '../db';
import { generatePresignedGetUrl } from '../lib/s3-client';
import { generateOrgSeoImage } from '../lib/seo-image-generator';
import { notifyNewOrganization } from '../lib/slack';

interface CreateOrganizationBody {
  name: string;
  nameEn?: string | null;
  description?: string | null;
  descriptionEn?: string | null;
  logoUrl?: string | null;
  parentId?: number | null;
}

const MAX_LIMIT = 100; // Maximum items per page to prevent huge queries

/**
 * POST /api/organizations
 * Create a new organization
 */
export async function createOrganization(req: Request, res: Response) {
  try {
    const body = req.body as CreateOrganizationBody;

    // Validate required fields
    if (!body.name || typeof body.name !== 'string') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Organization name is required',
        },
      });
    }

    const name = body.name.trim();

    if (name.length < 2) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Organization name must be at least 2 characters',
        },
      });
    }

    if (name.length > 255) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Organization name must not exceed 255 characters',
        },
      });
    }

    // Validate parent organization if provided
    if (body.parentId) {
      const [parentOrg] = await db
        .select({ id: schema.organizations.id })
        .from(schema.organizations)
        .where(eq(schema.organizations.id, body.parentId));

      if (!parentOrg) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Parent organization not found',
          },
        });
      }
    }

    // Get user/session info
    const userId = req.currentUser?.type === 'registered' ? req.currentUser.id : null;
    const sessionId = req.currentUser?.type === 'anonymous' ? req.currentUser.sessionId : null;

    // Create the organization
    const [newOrg] = await db
      .insert(schema.organizations)
      .values({
        name,
        nameEn: body.nameEn?.trim() || null,
        description: body.description?.trim() || null,
        descriptionEn: body.descriptionEn?.trim() || null,
        logoUrl: body.logoUrl || null,
        parentId: body.parentId || null,
        createdByUserId: userId,
        sessionId,
      })
      .returning();

    // If parent is specified, also create the hierarchy relationship
    if (body.parentId && newOrg) {
      await db.insert(schema.organizationHierarchy).values({
        parentId: body.parentId,
        childId: newOrg.id,
        createdByUserId: userId,
        sessionId,
      });
    }

    if (newOrg) {
      // Notify Slack about new organization
      notifyNewOrganization({
        id: newOrg.id,
        name: newOrg.name,
      }).catch(err => console.error('Slack notification error:', err));

      // Generate SEO image
      generateOrgSeoImage(newOrg.shareableUuid, newOrg.nameEn || newOrg.name, newOrg.logoUrl).catch(
        err => console.error('SEO image generation error:', err)
      );
    }

    // Generate presigned URL for logo
    if (newOrg?.logoUrl && !newOrg.logoUrl.startsWith('http')) {
      newOrg.logoUrl = await generatePresignedGetUrl(newOrg.logoUrl);
    }

    res.status(201).json({
      success: true,
      data: newOrg,
    });
  } catch (error) {
    console.error('Error creating organization:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to create organization',
      },
    });
  }
}

/**
 * GET /api/organizations
 * List all organizations (supports pagination and search)
 */
export async function listOrganizations(req: Request, res: Response) {
  try {
    const search = (req.query.q as string) || '';

    // Parse and validate pagination parameters
    const page = Math.max(1, Number.parseInt(req.query.page as string, 10) || 1);
    const parsedLimit = Number.parseInt(req.query.limit as string, 10) || 100;
    const limit = Math.min(Math.max(1, parsedLimit), MAX_LIMIT); // Clamp between 1 and MAX_LIMIT
    const offset = (page - 1) * limit;

    const query = db
      .select({
        id: schema.organizations.id,
        shareableUuid: schema.organizations.shareableUuid,
        name: schema.organizations.name,
        nameEn: schema.organizations.nameEn,
        description: schema.organizations.description,
        descriptionEn: schema.organizations.descriptionEn,
        logoUrl: schema.organizations.logoUrl,
        parentId: schema.organizations.parentId,
        createdByUserId: schema.organizations.createdByUserId,
        createdAt: schema.organizations.createdAt,
        updatedAt: schema.organizations.updatedAt,
      })
      .from(schema.organizations);

    if (search) {
      query.where(ilike(schema.organizations.name, `%${search}%`));
    }

    const organizations = await query
      .orderBy(schema.organizations.name)
      .limit(limit)
      .offset(offset);

    // Generate presigned URLs for logos
    const organizationsWithUrls = await Promise.all(
      organizations.map(async org => ({
        ...org,
        logoUrl: org.logoUrl
          ? org.logoUrl.startsWith('http')
            ? org.logoUrl
            : await generatePresignedGetUrl(org.logoUrl)
          : null,
      }))
    );

    // If page is provided, return paginated structure
    if (req.query.page) {
      const [totalCount] = await db.select({ count: count() }).from(schema.organizations);

      return res.json({
        success: true,
        data: {
          organizations: organizationsWithUrls,
          pagination: {
            total: totalCount.count,
            page,
            limit,
            totalPages: Math.ceil(totalCount.count / limit),
          },
        },
      });
    }

    res.json({
      success: true,
      data: organizationsWithUrls,
    });
  } catch (error) {
    console.error('Error listing organizations:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to list organizations',
      },
    });
  }
}

/**
 * DELETE /api/organizations/:id
 */
export async function deleteOrganization(req: Request, res: Response) {
  try {
    const organizationId = Number.parseInt(req.params.id, 10);
    if (Number.isNaN(organizationId)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_ID', message: 'Invalid organization ID' },
      });
    }

    const [deletedOrg] = await db
      .delete(schema.organizations)
      .where(eq(schema.organizations.id, organizationId))
      .returning({ id: schema.organizations.id });

    if (!deletedOrg) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Organization not found' },
      });
    }

    res.json({ success: true, data: { id: organizationId } });
  } catch (error) {
    console.error('Error deleting organization:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to delete organization' },
    });
  }
}

/**
 * GET /api/organizations/:id
 * Get a single organization by ID
 */
export async function getOrganization(req: Request, res: Response) {
  try {
    const organizationId = Number.parseInt(req.params.id, 10);

    if (Number.isNaN(organizationId)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ID',
          message: 'Invalid organization ID',
        },
      });
    }

    const [organization] = await db
      .select()
      .from(schema.organizations)
      .where(eq(schema.organizations.id, organizationId));

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

    res.json({
      success: true,
      data: organization,
    });
  } catch (error) {
    console.error('Error getting organization:', error);
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
 * PUT /api/organizations/:id
 * Update an organization
 */
export async function updateOrganization(req: Request, res: Response) {
  try {
    const organizationId = Number.parseInt(req.params.id, 10);

    if (Number.isNaN(organizationId)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ID',
          message: 'Invalid organization ID',
        },
      });
    }

    const body = req.body as Partial<CreateOrganizationBody>;

    // Check if organization exists
    const [existingOrg] = await db
      .select({ id: schema.organizations.id, logoUrl: schema.organizations.logoUrl })
      .from(schema.organizations)
      .where(eq(schema.organizations.id, organizationId));

    if (!existingOrg) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Organization not found',
        },
      });
    }

    // Prepare update data
    const updateData: Partial<typeof schema.organizations.$inferInsert> & { updatedAt: Date } = {
      updatedAt: new Date(),
    };

    if (body.name !== undefined) {
      const name = body.name.trim();
      if (name.length < 2) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Organization name must be at least 2 characters',
          },
        });
      }
      updateData.name = name;
    }

    if (body.nameEn !== undefined) {
      updateData.nameEn = body.nameEn?.trim() || null;
    }

    if (body.description !== undefined) {
      updateData.description = body.description?.trim() || null;
    }

    if (body.descriptionEn !== undefined) {
      updateData.descriptionEn = body.descriptionEn?.trim() || null;
    }

    if (body.logoUrl !== undefined) {
      updateData.logoUrl = body.logoUrl || null;
    }

    // Update the organization
    const [updatedOrg] = await db
      .update(schema.organizations)
      .set(updateData)
      .where(eq(schema.organizations.id, organizationId))
      .returning();

    // Regenerate SEO image
    if (updatedOrg) {
      await generateOrgSeoImage(
        updatedOrg.shareableUuid,
        updatedOrg.nameEn || updatedOrg.name,
        // Pass the original non-presigned URL from the database/updateData
        updateData.logoUrl !== undefined ? updateData.logoUrl : existingOrg.logoUrl
      ).catch(err => console.error('SEO image generation error:', err));
    }

    // Generate presigned URL for logo
    if (updatedOrg.logoUrl && !updatedOrg.logoUrl.startsWith('http')) {
      updatedOrg.logoUrl = await generatePresignedGetUrl(updatedOrg.logoUrl);
    }

    res.json({
      success: true,
      data: updatedOrg,
    });
  } catch (error) {
    console.error('Error updating organization:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to update organization',
      },
    });
  }
}

/**
 * GET /api/organizations/:id/roles
 * Get all roles for an organization
 */
export async function getOrganizationRoles(req: Request, res: Response) {
  try {
    const organizationId = Number.parseInt(req.params.id, 10);

    if (Number.isNaN(organizationId)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ID',
          message: 'Invalid organization ID',
        },
      });
    }

    // Check if organization exists
    const [organization] = await db
      .select({ id: schema.organizations.id })
      .from(schema.organizations)
      .where(eq(schema.organizations.id, organizationId));

    if (!organization) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Organization not found',
        },
      });
    }

    // Get roles for this organization
    const roles = await db
      .select({
        id: schema.roles.id,
        title: schema.roles.title,
        titleEn: schema.roles.titleEn,
        description: schema.roles.description,
        descriptionEn: schema.roles.descriptionEn,
      })
      .from(schema.roles)
      .where(eq(schema.roles.organizationId, organizationId))
      .orderBy(schema.roles.title);

    res.json({
      success: true,
      data: roles,
    });
  } catch (error) {
    console.error('Error getting organization roles:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get organization roles',
      },
    });
  }
}
