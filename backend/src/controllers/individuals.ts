// Individuals controller
// Handles CRUD operations for individuals (people)

import { eq } from 'drizzle-orm';
import type { Response } from 'express';
import { db, schema } from '../db';
import type { AuthenticatedRequest } from '../types/auth';

interface CreateIndividualBody {
  fullName: string;
  fullNameEn?: string | null;
  biography?: string | null;
  biographyEn?: string | null;
  dateOfBirth?: string | null;
  // Role assignment (optional)
  roleId?: number | null;
  organizationId?: number | null;
  startDate?: string | null;
}

/**
 * Create a new individual (person).
 *
 * Validates required `fullName` (2–255 characters). If `roleId` is provided, verifies the role exists and, when `organizationId` is supplied, that the role belongs to that organization. Uses the authenticated user's id as `createdByUserId` when available. Inserts the individual and, if `roleId` was provided, creates a role occupancy record with `startDate` from the request or the current date.
 *
 * @param req - Request containing the create body and authenticated user (if any)
 * @param res - Response object used to send HTTP status and JSON payload
 */
export async function createIndividual(req: AuthenticatedRequest, res: Response) {
  try {
    const body = req.body as CreateIndividualBody;

    // Validate required fields
    if (!body.fullName || typeof body.fullName !== 'string') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Full name is required',
        },
      });
    }

    const fullName = body.fullName.trim();

    if (fullName.length < 2) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Full name must be at least 2 characters',
        },
      });
    }

    if (fullName.length > 255) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Full name must not exceed 255 characters',
        },
      });
    }

    // Validate role if provided
    if (body.roleId) {
      const [role] = await db
        .select({ id: schema.roles.id, organizationId: schema.roles.organizationId })
        .from(schema.roles)
        .where(eq(schema.roles.id, body.roleId));

      if (!role) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Role not found',
          },
        });
      }

      // Verify the role belongs to the specified organization
      if (body.organizationId && role.organizationId !== body.organizationId) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Role does not belong to the specified organization',
          },
        });
      }
    }

    // Get user ID from session if authenticated
    const userId = req.user?.type === 'registered' ? req.user.id : null;

    // Create the individual
    const [newIndividual] = await db
      .insert(schema.individuals)
      .values({
        fullName,
        fullNameEn: body.fullNameEn?.trim() || null,
        biography: body.biography?.trim() || null,
        biographyEn: body.biographyEn?.trim() || null,
        dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : null,
        createdByUserId: userId,
      })
      .returning();

    // If role is specified, create role occupancy
    if (body.roleId && newIndividual) {
      await db.insert(schema.roleOccupancy).values({
        individualId: newIndividual.id,
        roleId: body.roleId,
        startDate: body.startDate ? new Date(body.startDate) : new Date(),
        createdByUserId: userId,
      });
    }

    res.status(201).json({
      success: true,
      data: newIndividual,
    });
  } catch (error) {
    console.error('Error creating individual:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to create individual',
      },
    });
  }
}

/**
 * List all individuals.
 *
 * Responds with JSON { success: true, data } where `data` is an array of individuals containing
 * id, fullName, fullNameEn, biography, biographyEn, dateOfBirth, and createdAt. On failure responds
 * with a 500 status and an `INTERNAL_ERROR` payload.
 */
export async function listIndividuals(_req: AuthenticatedRequest, res: Response) {
  try {
    const individuals = await db
      .select({
        id: schema.individuals.id,
        fullName: schema.individuals.fullName,
        fullNameEn: schema.individuals.fullNameEn,
        biography: schema.individuals.biography,
        biographyEn: schema.individuals.biographyEn,
        dateOfBirth: schema.individuals.dateOfBirth,
        createdAt: schema.individuals.createdAt,
      })
      .from(schema.individuals)
      .orderBy(schema.individuals.fullName);

    res.json({
      success: true,
      data: individuals,
    });
  } catch (error) {
    console.error('Error listing individuals:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to list individuals',
      },
    });
  }
}

/**
 * Retrieve and return the individual identified by the ID in the request path.
 *
 * The handler reads the numeric individual ID from `req.params.id`, responds with
 * 400 if the ID is invalid, 404 if no individual is found, and 500 on internal errors.
 *
 * @param req - The authenticated request; expects `req.params.id` to contain the numeric individual ID
 * @param res - Express response used to send the JSON result or error response
 */
export async function getIndividual(req: AuthenticatedRequest, res: Response) {
  try {
    const individualId = Number.parseInt(req.params.id, 10);

    if (Number.isNaN(individualId)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ID',
          message: 'Invalid individual ID',
        },
      });
    }

    const [individual] = await db
      .select()
      .from(schema.individuals)
      .where(eq(schema.individuals.id, individualId));

    if (!individual) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Individual not found',
        },
      });
    }

    res.json({
      success: true,
      data: individual,
    });
  } catch (error) {
    console.error('Error getting individual:', error);
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
 * Update an existing individual identified by the URL `:id` with the provided fields.
 *
 * Validates the ID and required field constraints (fullName at least 2 characters), trims string fields,
 * converts `dateOfBirth` to a Date or `null`, sets `updatedAt`, and persists the changes.
 *
 * Responds with JSON error shapes for:
 * - `INVALID_ID` (400) when the `id` path parameter is not a valid integer.
 * - `NOT_FOUND` (404) when no individual exists with the given ID.
 * - `VALIDATION_ERROR` (400) when provided `fullName` is shorter than 2 characters.
 * - `INTERNAL_ERROR` (500) on unexpected failures.
 */
export async function updateIndividual(req: AuthenticatedRequest, res: Response) {
  try {
    const individualId = Number.parseInt(req.params.id, 10);

    if (Number.isNaN(individualId)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ID',
          message: 'Invalid individual ID',
        },
      });
    }

    const body = req.body as Partial<CreateIndividualBody>;

    // Check if individual exists
    const [existingIndividual] = await db
      .select({ id: schema.individuals.id })
      .from(schema.individuals)
      .where(eq(schema.individuals.id, individualId));

    if (!existingIndividual) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Individual not found',
        },
      });
    }

    // Prepare update data
    const updateData: Partial<typeof schema.individuals.$inferInsert> & { updatedAt: Date } = {
      updatedAt: new Date(),
    };

    if (body.fullName !== undefined) {
      const fullName = body.fullName.trim();
      if (fullName.length < 2) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Full name must be at least 2 characters',
          },
        });
      }
      updateData.fullName = fullName;
    }

    if (body.fullNameEn !== undefined) {
      updateData.fullNameEn = body.fullNameEn?.trim() || null;
    }

    if (body.biography !== undefined) {
      updateData.biography = body.biography?.trim() || null;
    }

    if (body.biographyEn !== undefined) {
      updateData.biographyEn = body.biographyEn?.trim() || null;
    }

    if (body.dateOfBirth !== undefined) {
      updateData.dateOfBirth = body.dateOfBirth ? new Date(body.dateOfBirth) : null;
    }

    // Update the individual
    const [updatedIndividual] = await db
      .update(schema.individuals)
      .set(updateData)
      .where(eq(schema.individuals.id, individualId))
      .returning();

    res.json({
      success: true,
      data: updatedIndividual,
    });
  } catch (error) {
    console.error('Error updating individual:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to update individual',
      },
    });
  }
}