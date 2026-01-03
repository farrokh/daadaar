// Roles controller
// Handles CRUD operations for roles within organizations

import { eq } from 'drizzle-orm';
import type { Response } from 'express';
import { db, schema } from '../db';
import type { AuthenticatedRequest } from '../types/auth';

interface CreateRoleBody {
  organizationId: number;
  title: string;
  titleEn?: string | null;
  description?: string | null;
  descriptionEn?: string | null;
}

/**
 * Create a new role for an organization and respond with the created role.
 *
 * Validates required input (organizationId and title), ensures the organization exists,
 * and associates the creator when authenticated. Responds with 201 and the new role on success,
 * 400 for validation errors (error codes like `VALIDATION_ERROR`, `INVALID_ID`, `NOT_FOUND`), and
 * 500 for internal failures (`INTERNAL_ERROR`).
 */
export async function createRole(req: AuthenticatedRequest, res: Response) {
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

    // Get user ID from session if authenticated
    const userId = req.user?.type === 'registered' ? req.user.id : null;

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
 * List roles, optionally filtered by organization.
 *
 * Responds with a JSON payload containing an array of roles. If the query
 * parameter `organizationId` is provided and is a valid number, results are
 * filtered to that organization. Results are ordered by role title.
 */
export async function listRoles(req: AuthenticatedRequest, res: Response) {
  try {
    const organizationId = req.query.organizationId
      ? Number.parseInt(req.query.organizationId as string, 10)
      : undefined;

    let query = db
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

    if (organizationId && !Number.isNaN(organizationId)) {
      query = query.where(eq(schema.roles.organizationId, organizationId)) as typeof query;
    }

    const roles = await query.orderBy(schema.roles.title);

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
 * Retrieve a role by its numeric ID and send it in the HTTP response.
 *
 * Responds with 400 (code `INVALID_ID`) when the ID is not a valid number, 404 (code `NOT_FOUND`) when no role exists for the given ID, 200 with the role data on success, and 500 (code `INTERNAL_ERROR`) on unexpected failures.
 */
export async function getRole(req: AuthenticatedRequest, res: Response) {
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
 * Handle updating an existing role identified by the route `:id`.
 *
 * Validates the numeric role ID, accepts partial updates for `title`, `titleEn`,
 * `description`, and `descriptionEn`, and returns the updated role on success.
 *
 * Behavior:
 * - If the `id` route parameter is not a valid number, responds with 400 and error code `INVALID_ID`.
 * - If no role exists with the given ID, responds with 404 and error code `NOT_FOUND`.
 * - If `title` is provided and shorter than 2 characters, responds with 400 and error code `VALIDATION_ERROR`.
 * - On success, responds with `{ success: true, data: updatedRole }`.
 * - On unexpected failures, responds with 500 and error code `INTERNAL_ERROR`.
 *
 * @param req - AuthenticatedRequest with `params.id` (role ID) and a partial `CreateRoleBody` in `body`
 * @param res - Express response used to send JSON results
 */
export async function updateRole(req: AuthenticatedRequest, res: Response) {
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
 * Delete a role by its ID.
 *
 * Validates the route parameter `id` as a numeric role ID, returns a 400 response with error code `INVALID_ID` if invalid, a 404 response with error code `NOT_FOUND` if no role exists with that ID, deletes the role (cascade handles related records), and returns a success message; on unexpected failures responds with error code `INTERNAL_ERROR`.
 *
 * @param req - Request containing route parameter `id` (the role ID)
 * @param res - Express response used to send JSON results
 */
export async function deleteRole(req: AuthenticatedRequest, res: Response) {
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