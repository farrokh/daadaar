// Individuals controller
// Handles CRUD operations for individuals (people)

import { and, eq, or } from 'drizzle-orm';
import type { Request, Response } from 'express';
import { db, schema } from '../db';
import { generatePresignedGetUrl } from '../lib/s3-client';
import { notifyNewIndividual } from '../lib/slack';

interface CreateIndividualBody {
  fullName: string;
  fullNameEn?: string | null;
  biography?: string | null;
  biographyEn?: string | null;
  profileImageUrl?: string | null;
  dateOfBirth?: string | null;
  // Role assignment (optional)
  roleId?: number | null;
  organizationId?: number | null;
  startDate?: string | null;
  endDate?: string | null;
}

const DEFAULT_MEMBER_ROLE_TITLE = 'Member';
const DEFAULT_MEMBER_ROLE_DESCRIPTION = 'Default role for organization members';

const getOrCreateDefaultRoleId = async ({
  organizationId,
  userId,
  sessionId,
}: {
  organizationId: number;
  userId: number | null;
  sessionId: string | null;
}): Promise<number> => {
  const [existingRole] = await db
    .select({ id: schema.roles.id })
    .from(schema.roles)
    .where(
      and(
        eq(schema.roles.organizationId, organizationId),
        or(
          eq(schema.roles.title, DEFAULT_MEMBER_ROLE_TITLE),
          eq(schema.roles.titleEn, DEFAULT_MEMBER_ROLE_TITLE)
        )
      )
    )
    .limit(1);

  if (existingRole) {
    return existingRole.id;
  }

  const [createdRole] = await db
    .insert(schema.roles)
    .values({
      organizationId,
      title: DEFAULT_MEMBER_ROLE_TITLE,
      titleEn: DEFAULT_MEMBER_ROLE_TITLE,
      description: DEFAULT_MEMBER_ROLE_DESCRIPTION,
      descriptionEn: DEFAULT_MEMBER_ROLE_DESCRIPTION,
      createdByUserId: userId,
      sessionId,
    })
    .returning({ id: schema.roles.id });

  if (!createdRole) {
    throw new Error('Failed to create default role');
  }

  return createdRole.id;
};

/**
 * POST /api/individuals
 * Create a new individual (person)
 */
export async function createIndividual(req: Request, res: Response) {
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

    // Get user/session info
    const userId = req.currentUser?.type === 'registered' ? req.currentUser.id : null;
    const sessionId = req.currentUser?.type === 'anonymous' ? req.currentUser.sessionId : null;

    // Auto-create a default role when an organization is provided without a role
    let resolvedRoleId = body.roleId ?? null;
    if (!resolvedRoleId && body.organizationId) {
      const [organization] = await db
        .select({ id: schema.organizations.id })
        .from(schema.organizations)
        .where(eq(schema.organizations.id, body.organizationId))
        .limit(1);

      if (!organization) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Organization not found',
          },
        });
      }

      resolvedRoleId = await getOrCreateDefaultRoleId({
        organizationId: body.organizationId,
        userId,
        sessionId,
      });
    }

    // Create the individual
    const [newIndividual] = await db
      .insert(schema.individuals)
      .values({
        fullName,
        fullNameEn: body.fullNameEn?.trim() || null,
        biography: body.biography?.trim() || null,
        biographyEn: body.biographyEn?.trim() || null,
        profileImageUrl: body.profileImageUrl || null,
        dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : null,
        createdByUserId: userId,
        sessionId,
      })
      .returning();

    // If role is specified or resolved, create role occupancy
    if (resolvedRoleId && newIndividual) {
      await db.insert(schema.roleOccupancy).values({
        individualId: newIndividual.id,
        roleId: resolvedRoleId,
        startDate: body.startDate ? new Date(body.startDate) : new Date(),
        endDate: body.endDate ? new Date(body.endDate) : null,
        createdByUserId: userId,
        sessionId,
      });
    }

    if (newIndividual) {
      // Notify Slack about new individual
      notifyNewIndividual({
        id: newIndividual.id,
        fullName: newIndividual.fullName,
      }).catch(err => console.error('Slack notification error:', err));
    }

    // Generate presigned URL for profile image
    if (newIndividual?.profileImageUrl && !newIndividual.profileImageUrl.startsWith('http')) {
      newIndividual.profileImageUrl = await generatePresignedGetUrl(newIndividual.profileImageUrl);
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
 * GET /api/individuals
 * List all individuals
 */
export async function listIndividuals(_req: Request, res: Response) {
  try {
    const individuals = await db
      .select({
        id: schema.individuals.id,
        fullName: schema.individuals.fullName,
        fullNameEn: schema.individuals.fullNameEn,
        biography: schema.individuals.biography,
        biographyEn: schema.individuals.biographyEn,
        profileImageUrl: schema.individuals.profileImageUrl,
        dateOfBirth: schema.individuals.dateOfBirth,
        createdAt: schema.individuals.createdAt,
      })
      .from(schema.individuals)
      .orderBy(schema.individuals.fullName);

    // Generate presigned URLs for profile images
    const individualsWithUrls = await Promise.all(
      individuals.map(async ind => ({
        ...ind,
        profileImageUrl: ind.profileImageUrl
          ? ind.profileImageUrl.startsWith('http')
            ? ind.profileImageUrl
            : await generatePresignedGetUrl(ind.profileImageUrl)
          : null,
      }))
    );

    res.json({
      success: true,
      data: individualsWithUrls,
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
 * GET /api/individuals/:id
 * Get a single individual by ID
 */
export async function getIndividual(req: Request, res: Response) {
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

    // Generate presigned URL for profile image
    if (individual.profileImageUrl && !individual.profileImageUrl.startsWith('http')) {
      individual.profileImageUrl = await generatePresignedGetUrl(individual.profileImageUrl);
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
 * PUT /api/individuals/:id
 * Update an individual
 */
export async function updateIndividual(req: Request, res: Response) {
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

    if (body.profileImageUrl !== undefined) {
      updateData.profileImageUrl = body.profileImageUrl || null;
    }

    if (body.dateOfBirth !== undefined) {
      updateData.dateOfBirth = body.dateOfBirth ? new Date(body.dateOfBirth) : null;
    }

    if (body.organizationId) {
      const [organization] = await db
        .select({ id: schema.organizations.id })
        .from(schema.organizations)
        .where(eq(schema.organizations.id, body.organizationId))
        .limit(1);

      if (!organization) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Organization not found',
          },
        });
      }

      const [existingRole] = await db
        .select({ id: schema.roleOccupancy.id })
        .from(schema.roleOccupancy)
        .where(eq(schema.roleOccupancy.individualId, individualId))
        .limit(1);

      if (!existingRole) {
        const userId = req.currentUser?.type === 'registered' ? req.currentUser.id : null;
        const sessionId = req.currentUser?.type === 'anonymous' ? req.currentUser.sessionId : null;
        const memberRoleId = await getOrCreateDefaultRoleId({
          organizationId: body.organizationId,
          userId,
          sessionId,
        });

        await db.insert(schema.roleOccupancy).values({
          individualId,
          roleId: memberRoleId,
          startDate: new Date(),
          endDate: null,
          createdByUserId: userId,
          sessionId,
        });
      }
    }

    // Update the individual
    const [updatedIndividual] = await db
      .update(schema.individuals)
      .set(updateData)
      .where(eq(schema.individuals.id, individualId))
      .returning();

    // Generate presigned URL for profile image
    if (
      updatedIndividual.profileImageUrl &&
      !updatedIndividual.profileImageUrl.startsWith('http')
    ) {
      updatedIndividual.profileImageUrl = await generatePresignedGetUrl(
        updatedIndividual.profileImageUrl
      );
    }

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
