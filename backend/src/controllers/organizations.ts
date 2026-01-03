// Organizations controller
// Handles CRUD operations for organizations

import { eq } from 'drizzle-orm';
import type { Response } from 'express';
import { db, schema } from '../db';
import type { AuthenticatedRequest } from '../types/auth';

interface CreateOrganizationBody {
  name: string;
  nameEn?: string | null;
  description?: string | null;
  descriptionEn?: string | null;
  parentId?: number | null;
}

/**
 * Create a new organization from the HTTP request body.
 *
 * Validates required `name` (trimmed, 2–255 characters) and optional `parentId`, associates the creating user when authenticated, inserts the organization (and a parent–child hierarchy record if `parentId` is provided), and sends the created organization in the response.
 *
 * @param req - Express request whose body contains the organization fields: `name` (required), `nameEn`, `description`, `descriptionEn`, and optional `parentId`
 * @param res - Express response used to send success (201) or error (400/500) responses
 */
export async function createOrganization(req: AuthenticatedRequest, res: Response) {
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

    // Get user ID from session if authenticated
    const userId = req.user?.type === 'registered' ? req.user.id : null;

    // Create the organization
    const [newOrg] = await db
      .insert(schema.organizations)
      .values({
        name,
        nameEn: body.nameEn?.trim() || null,
        description: body.description?.trim() || null,
        descriptionEn: body.descriptionEn?.trim() || null,
        parentId: body.parentId || null,
        createdByUserId: userId,
      })
      .returning();

    // If parent is specified, also create the hierarchy relationship
    if (body.parentId && newOrg) {
      await db.insert(schema.organizationHierarchy).values({
        parentId: body.parentId,
        childId: newOrg.id,
        createdByUserId: userId,
      });
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
export async function listOrganizations(_req: AuthenticatedRequest, res: Response) {
  try {
    const organizations = await db
      .select({
        id: schema.organizations.id,
        name: schema.organizations.name,
        nameEn: schema.organizations.nameEn,
        description: schema.organizations.description,
        descriptionEn: schema.organizations.descriptionEn,
        parentId: schema.organizations.parentId,
        createdAt: schema.organizations.createdAt,
      })
      .from(schema.organizations)
      .orderBy(schema.organizations.name);

    res.json({
      success: true,
      data: organizations,
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
 * Fetches an organization by ID and returns it in the response.
 *
 * Validates req.params.id as an integer; responds with 400 (`INVALID_ID`) if invalid,
 * 404 (`NOT_FOUND`) if no organization exists with that ID, or 200 with the organization
 * object in `data`. On unexpected errors responds with 500 (`INTERNAL_ERROR`).
 */
export async function getOrganization(req: AuthenticatedRequest, res: Response) {
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
 * Update an existing organization by ID.
 *
 * Validates the numeric ID and returns 400 with code `INVALID_ID` if invalid. If the organization does not exist, responds 404 with code `NOT_FOUND`. Accepts partial fields from the request body and applies updates: trims `name`, `nameEn`, `description`, and `descriptionEn`; sets empty or missing optional strings to `null`; enforces `name` length of at least 2 characters (returns 400 with code `VALIDATION_ERROR` if violated). Sets `updatedAt` to the current time and returns the updated organization in the response body on success.
 */
export async function updateOrganization(req: AuthenticatedRequest, res: Response) {
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

    // Update the organization
    const [updatedOrg] = await db
      .update(schema.organizations)
      .set(updateData)
      .where(eq(schema.organizations.id, organizationId))
      .returning();

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
 * Return the list of roles associated with a specific organization.
 *
 * Validates the organization ID from route parameters; responds with a 400 error for an invalid ID,
 * a 404 error if the organization does not exist, a 200 response containing the organization's roles on success,
 * and a 500 error for unexpected server failures.
 */
export async function getOrganizationRoles(req: AuthenticatedRequest, res: Response) {
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