// Individuals controller
// Handles CRUD operations for individuals (people)

import { and, count, desc, eq, ilike, or } from 'drizzle-orm';
import type { Request, Response } from 'express';
import { db, schema } from '../db';
import { generatePresignedGetUrl } from '../lib/s3-client';
import { generateIndividualSeoImage } from '../lib/seo-image-generator';
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
const MAX_LIMIT = 100; // Maximum items per page to prevent huge queries

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

      // Generate SEO image
      generateIndividualSeoImage(
        newIndividual.shareableUuid,
        newIndividual.fullNameEn || newIndividual.fullName,
        newIndividual.profileImageUrl,
        newIndividual.biographyEn || newIndividual.biography
      ).catch(err => console.error('SEO image generation error:', err));
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
 * List all individuals (supports pagination and search)
 */
export async function listIndividuals(req: Request, res: Response) {
  try {
    const search = (req.query.q as string) || '';

    // Parse and validate pagination parameters
    const page = Math.max(1, Number.parseInt(req.query.page as string, 10) || 1);
    const parsedLimit = Number.parseInt(req.query.limit as string, 10) || 100;
    const limit = Math.min(Math.max(1, parsedLimit), MAX_LIMIT); // Clamp between 1 and MAX_LIMIT
    const offset = (page - 1) * limit;

    const query = db
      .select({
        id: schema.individuals.id,
        shareableUuid: schema.individuals.shareableUuid,
        fullName: schema.individuals.fullName,
        fullNameEn: schema.individuals.fullNameEn,
        biography: schema.individuals.biography,
        biographyEn: schema.individuals.biographyEn,
        profileImageUrl: schema.individuals.profileImageUrl,
        dateOfBirth: schema.individuals.dateOfBirth,
        createdByUserId: schema.individuals.createdByUserId,
        createdAt: schema.individuals.createdAt,
        updatedAt: schema.individuals.updatedAt,
      })
      .from(schema.individuals);

    if (search) {
      query.where(ilike(schema.individuals.fullName, `%${search}%`));
    }

    const individuals = await query
      .orderBy(schema.individuals.fullName)
      .limit(limit)
      .offset(offset);

    // Populate extra info for each individual (role, organization, presigned URL)
    const individualsWithInfo = await Promise.all(
      individuals.map(async ind => {
        // Get current role and organization
        const [roleInfo] = await db
          .select({
            roleTitle: schema.roles.title,
            orgName: schema.organizations.name,
            orgId: schema.organizations.id,
          })
          .from(schema.roleOccupancy)
          .innerJoin(schema.roles, eq(schema.roleOccupancy.roleId, schema.roles.id))
          .innerJoin(schema.organizations, eq(schema.roles.organizationId, schema.organizations.id))
          .where(eq(schema.roleOccupancy.individualId, ind.id))
          .orderBy(desc(schema.roleOccupancy.startDate))
          .limit(1);

        return {
          ...ind,
          currentRole: roleInfo?.roleTitle || null,
          currentOrganization: roleInfo?.orgName || null,
          currentOrganizationId: roleInfo?.orgId || null,
          profileImageUrl: ind.profileImageUrl
            ? ind.profileImageUrl.startsWith('http')
              ? ind.profileImageUrl
              : await generatePresignedGetUrl(ind.profileImageUrl)
            : null,
        };
      })
    );

    // If page is provided, return paginated structure
    if (req.query.page) {
      const [totalCount] = await db.select({ count: count() }).from(schema.individuals);

      return res.json({
        success: true,
        data: {
          individuals: individualsWithInfo,
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
      data: individualsWithInfo,
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
 * DELETE /api/individuals/:id
 */
export async function deleteIndividual(req: Request, res: Response) {
  try {
    const individualId = Number.parseInt(req.params.id, 10);
    if (Number.isNaN(individualId)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_ID', message: 'Invalid individual ID' },
      });
    }

    const [deletedInd] = await db
      .delete(schema.individuals)
      .where(eq(schema.individuals.id, individualId))
      .returning({ id: schema.individuals.id });

    if (!deletedInd) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Individual not found' },
      });
    }

    res.json({ success: true, data: { id: individualId } });
  } catch (error) {
    console.error('Error deleting individual:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to delete individual' },
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

      // Find the latest role occupancy for this individual
      const [latestRoleOccupancy] = await db
        .select({ id: schema.roleOccupancy.id })
        .from(schema.roleOccupancy)
        .where(eq(schema.roleOccupancy.individualId, individualId))
        .orderBy(desc(schema.roleOccupancy.startDate))
        .limit(1);

      if (latestRoleOccupancy) {
        // Update existing latest role occupancy
        const roleUpdateData: Partial<typeof schema.roleOccupancy.$inferInsert> = {};

        if (body.roleId !== undefined) {
          roleUpdateData.roleId = body.roleId || undefined;
        }

        if (body.startDate) {
          // startDate is not null, so only update if we have a value
          roleUpdateData.startDate = new Date(body.startDate);
        }

        if (body.endDate !== undefined) {
          // endDate is nullable
          // @ts-ignore - Drizzle type inference for nullable timestamp sometimes conflicts with strict null checks
          roleUpdateData.endDate = body.endDate ? new Date(body.endDate) : null;
        }

        if (req.currentUser?.type === 'registered') {
          roleUpdateData.createdByUserId = req.currentUser.id;
        }
        if (Object.keys(roleUpdateData).length > 0) {
          await db
            .update(schema.roleOccupancy)
            .set(roleUpdateData)
            .where(eq(schema.roleOccupancy.id, latestRoleOccupancy.id));
        }
      } else {
        // Create new role occupancy if none exists
        const userId = req.currentUser?.type === 'registered' ? req.currentUser.id : null;
        const sessionId = req.currentUser?.type === 'anonymous' ? req.currentUser.sessionId : null;

        let roleIdToUse = body.roleId;

        if (!roleIdToUse) {
          roleIdToUse = await getOrCreateDefaultRoleId({
            organizationId: body.organizationId,
            userId,
            sessionId,
          });
        }

        if (roleIdToUse) {
          await db.insert(schema.roleOccupancy).values({
            individualId,
            roleId: roleIdToUse,
            startDate: body.startDate ? new Date(body.startDate) : new Date(),
            endDate: body.endDate ? new Date(body.endDate) : null,
            createdByUserId: userId,
            sessionId,
          });
        }
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

    // Regenerate SEO image
    if (updatedIndividual) {
      await generateIndividualSeoImage(
        updatedIndividual.shareableUuid,
        updatedIndividual.fullNameEn || updatedIndividual.fullName,
        updatedIndividual.profileImageUrl,
        updatedIndividual.biographyEn || updatedIndividual.biography
      ).catch(err => console.error('SEO image generation error:', err));
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

/**
 * GET /api/individuals/:id/roles
 * Get all role occupancies for an individual
 */
export async function getIndividualRoles(req: Request, res: Response) {
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

    // Check if individual exists
    const [individual] = await db
      .select({ id: schema.individuals.id })
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

    // Get role occupancies for this individual
    const roleOccupancies = await db
      .select({
        id: schema.roleOccupancy.id,
        roleId: schema.roleOccupancy.roleId,
        startDate: schema.roleOccupancy.startDate,
        endDate: schema.roleOccupancy.endDate,
      })
      .from(schema.roleOccupancy)
      .where(eq(schema.roleOccupancy.individualId, individualId))
      .orderBy(desc(schema.roleOccupancy.startDate));

    res.json({
      success: true,
      data: roleOccupancies,
    });
  } catch (error) {
    console.error('Error getting individual roles:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get individual roles',
      },
    });
  }
}
