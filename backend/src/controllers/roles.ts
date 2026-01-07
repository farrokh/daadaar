// Roles controller
// Handles CRUD operations for roles within organizations

import { and, count, eq, ilike } from 'drizzle-orm';
import type { Request, Response } from 'express';
import { db, schema } from '../db';

interface CreateRoleBody {
  organizationId: number;
  title: string;
  titleEn?: string | null;
  description?: string | null;
  descriptionEn?: string | null;
}

const MAX_LIMIT = 100; // Maximum items per page to prevent huge queries

/**
 * POST /api/roles
 * Create a new role for an organization
 */
export async function createRole(req: Request, res: Response) {
  try {
    const body = req.body as CreateRoleBody;

    // Validate required fields
    if (!body.organizationId || typeof body.organizationId !== 'number') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Organization ID is required',
        },
      });
    }

    if (!body.title || typeof body.title !== 'string') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Role title is required',
        },
      });
    }

    const title = body.title.trim();

    if (title.length < 2) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Role title must be at least 2 characters',
        },
      });
    }

    if (title.length > 255) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Role title must not exceed 255 characters',
        },
      });
    }

    // Validate organization exists
    const [organization] = await db
      .select({ id: schema.organizations.id })
      .from(schema.organizations)
      .where(eq(schema.organizations.id, body.organizationId));

    if (!organization) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Organization not found',
        },
      });
    }

    // Get user/session info
    const userId = req.currentUser?.type === 'registered' ? req.currentUser.id : null;
    const sessionId = req.currentUser?.type === 'anonymous' ? req.currentUser.sessionId : null;

    // Create the role
    const [newRole] = await db
      .insert(schema.roles)
      .values({
        organizationId: body.organizationId,
        title,
        titleEn: body.titleEn?.trim() || null,
        description: body.description?.trim() || null,
        descriptionEn: body.descriptionEn?.trim() || null,
        createdByUserId: userId,
        sessionId,
      })
      .returning();

    res.status(201).json({
      success: true,
      data: newRole,
    });
  } catch (error) {
    console.error('Error creating role:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to create role',
      },
    });
  }
}

/**
 * GET /api/roles
 * List all roles (optionally filtered by organization, supports pagination and search)
 */
export async function listRoles(req: Request, res: Response) {
  try {
    const organizationId = req.query.organizationId
      ? Number.parseInt(req.query.organizationId as string, 10)
      : undefined;
    const search = (req.query.q as string) || '';

    // Parse and validate pagination parameters
    const page = Math.max(1, Number.parseInt(req.query.page as string, 10) || 1);
    const parsedLimit = Number.parseInt(req.query.limit as string, 10) || 100;
    const limit = Math.min(Math.max(1, parsedLimit), MAX_LIMIT); // Clamp between 1 and MAX_LIMIT
    const offset = (page - 1) * limit;

    const query = db
      .select({
        id: schema.roles.id,
        organizationId: schema.roles.organizationId,
        title: schema.roles.title,
        titleEn: schema.roles.titleEn,
        description: schema.roles.description,
        descriptionEn: schema.roles.descriptionEn,
        createdAt: schema.roles.createdAt,
      })
      .from(schema.roles);

    const filters = [];
    if (organizationId && !Number.isNaN(organizationId)) {
      filters.push(eq(schema.roles.organizationId, organizationId));
    }
    if (search) {
      filters.push(ilike(schema.roles.title, `%${search}%`));
    }

    if (filters.length > 0) {
      query.where(and(...filters));
    }

    const roles = await query.orderBy(schema.roles.title).limit(limit).offset(offset);

    // If page is provided, return paginated structure
    if (req.query.page) {
      const [totalCount] = await db
        .select({ count: count() })
        .from(schema.roles)
        .where(filters.length > 0 ? and(...filters) : undefined);

      return res.json({
        success: true,
        data: {
          roles,
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
      data: roles,
    });
  } catch (error) {
    console.error('Error listing roles:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to list roles',
      },
    });
  }
}

/**
 * GET /api/roles/:id
 * Get a single role by ID
 */
export async function getRole(req: Request, res: Response) {
  try {
    const roleId = Number.parseInt(req.params.id, 10);

    if (Number.isNaN(roleId)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ID',
          message: 'Invalid role ID',
        },
      });
    }

    const [role] = await db.select().from(schema.roles).where(eq(schema.roles.id, roleId));

    if (!role) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Role not found',
        },
      });
    }

    res.json({
      success: true,
      data: role,
    });
  } catch (error) {
    console.error('Error getting role:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get role',
      },
    });
  }
}

/**
 * PUT /api/roles/:id
 * Update a role
 */
export async function updateRole(req: Request, res: Response) {
  try {
    const roleId = Number.parseInt(req.params.id, 10);

    if (Number.isNaN(roleId)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ID',
          message: 'Invalid role ID',
        },
      });
    }

    const body = req.body as Partial<CreateRoleBody>;

    // Check if role exists
    const [existingRole] = await db
      .select({ id: schema.roles.id })
      .from(schema.roles)
      .where(eq(schema.roles.id, roleId));

    if (!existingRole) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Role not found',
        },
      });
    }

    // Prepare update data
    const updateData: Partial<typeof schema.roles.$inferInsert> & { updatedAt: Date } = {
      updatedAt: new Date(),
    };

    if (body.title !== undefined) {
      const title = body.title.trim();
      if (title.length < 2) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Role title must be at least 2 characters',
          },
        });
      }
      updateData.title = title;
    }

    if (body.titleEn !== undefined) {
      updateData.titleEn = body.titleEn?.trim() || null;
    }

    if (body.description !== undefined) {
      updateData.description = body.description?.trim() || null;
    }

    if (body.descriptionEn !== undefined) {
      updateData.descriptionEn = body.descriptionEn?.trim() || null;
    }

    // Update the role
    const [updatedRole] = await db
      .update(schema.roles)
      .set(updateData)
      .where(eq(schema.roles.id, roleId))
      .returning();

    res.json({
      success: true,
      data: updatedRole,
    });
  } catch (error) {
    console.error('Error updating role:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to update role',
      },
    });
  }
}

/**
 * DELETE /api/roles/:id
 * Delete a role
 */
export async function deleteRole(req: Request, res: Response) {
  try {
    const roleId = Number.parseInt(req.params.id, 10);

    if (Number.isNaN(roleId)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ID',
          message: 'Invalid role ID',
        },
      });
    }

    // Check if role exists
    const [existingRole] = await db
      .select({ id: schema.roles.id })
      .from(schema.roles)
      .where(eq(schema.roles.id, roleId));

    if (!existingRole) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Role not found',
        },
      });
    }

    // Delete the role (cascade will handle role_occupancy)
    await db.delete(schema.roles).where(eq(schema.roles.id, roleId));

    res.json({
      success: true,
      message: 'Role deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting role:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to delete role',
      },
    });
  }
}
