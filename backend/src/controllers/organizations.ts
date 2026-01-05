// Organizations controller
// Handles CRUD operations for organizations

import { eq } from 'drizzle-orm';
import type { Request, Response } from 'express';
import { db, schema } from '../db';
import { generatePresignedGetUrl } from '../lib/s3-client';

interface CreateOrganizationBody {
  name: string;
  nameEn?: string | null;
  description?: string | null;
  descriptionEn?: string | null;
  logoUrl?: string | null;
  parentId?: number | null;
}

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
 * List all organizations
 */
export async function listOrganizations(_req: Request, res: Response) {
  try {
    const organizations = await db
      .select({
        id: schema.organizations.id,
        name: schema.organizations.name,
        nameEn: schema.organizations.nameEn,
        description: schema.organizations.description,
        descriptionEn: schema.organizations.descriptionEn,
        logoUrl: schema.organizations.logoUrl,
        parentId: schema.organizations.parentId,
        createdAt: schema.organizations.createdAt,
      })
      .from(schema.organizations)
      .orderBy(schema.organizations.name);

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
      .select({ id: schema.organizations.id })
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
