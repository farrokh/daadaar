import { and, count, desc, eq, ilike, or } from 'drizzle-orm';
import type { Request, Response } from 'express';
import { db, schema } from '../../db';

const sanitizeRole = (role?: string) => {
  if (role === 'user' || role === 'moderator' || role === 'admin') {
    return role;
  }
  return null;
};

/**
 * GET /api/admin/users
 * List platform users with pagination and filtering
 */
export async function listUsers(req: Request, res: Response) {
  try {
    const search = (req.query.q as string) || '';
    const role = sanitizeRole(req.query.role as string | undefined);
    const isBanned =
      typeof req.query.isBanned === 'string' ? req.query.isBanned === 'true' : undefined;
    const page = Number.parseInt(req.query.page as string, 10) || 1;
    const limit = Number.parseInt(req.query.limit as string, 10) || 20;
    const offset = (page - 1) * limit;

    const filters = [] as ReturnType<typeof eq>[];

    if (search) {
      const pattern = `%${search}%`;
      // biome-ignore lint/suspicious/noExplicitAny: drizzle or conditions type is complex
      filters.push(
        (or as any)(
          ilike(schema.users.username, pattern),
          ilike(schema.users.email, pattern),
          ilike(schema.users.displayName, pattern)
        )
      );
    }

    if (role) {
      filters.push(eq(schema.users.role, role));
    }

    if (typeof isBanned === 'boolean') {
      filters.push(eq(schema.users.isBanned, isBanned));
    }

    const where = filters.length ? and(...filters) : undefined;

    const users = await db.query.users.findMany({
      where,
      columns: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        profileImageUrl: true,
        role: true,
        isBanned: true,
        bannedAt: true,
        bannedUntil: true,
        banReason: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: [desc(schema.users.createdAt)],
      limit,
      offset,
    });

    const [totalCount] = await db
      .select({ count: count() })
      .from(schema.users)
      .where(where);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          total: totalCount.count,
          page,
          limit,
          totalPages: Math.ceil(totalCount.count / limit),
        },
      },
    });
  } catch (error) {
    console.error('Error listing users:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to list users' },
    });
  }
}

interface UpdateUserBody {
  role?: 'user' | 'moderator' | 'admin';
  isBanned?: boolean;
  banReason?: string | null;
  bannedUntil?: string | null;
  displayName?: string | null;
}

/**
 * PATCH /api/admin/users/:id
 * Update role or ban status for a user
 */
export async function updateUser(req: Request, res: Response) {
  try {
    const userId = Number.parseInt(req.params.id, 10);
    if (Number.isNaN(userId)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_ID', message: 'Invalid user ID' },
      });
    }

    const body = req.body as UpdateUserBody;
    const updates: Record<string, unknown> = {};

    if (body.role) {
      const normalizedRole = sanitizeRole(body.role);
      if (!normalizedRole) {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Invalid role provided' },
        });
      }
      updates.role = normalizedRole;
    }

    if (typeof body.isBanned === 'boolean') {
      if (body.isBanned) {
        updates.isBanned = true;
        updates.bannedAt = new Date();
        updates.bannedUntil = body.bannedUntil ? new Date(body.bannedUntil) : null;
        updates.banReason = body.banReason?.trim() || 'Banned via admin panel';
      } else {
        updates.isBanned = false;
        updates.bannedAt = null;
        updates.bannedUntil = null;
        updates.banReason = null;
      }
    }

    if (body.displayName !== undefined) {
      updates.displayName = body.displayName?.trim() || null;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        error: { code: 'NO_UPDATES', message: 'No valid fields provided to update' },
      });
    }

    const [user] = await db
      .update(schema.users)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(schema.users.id, userId))
      .returning({
        id: schema.users.id,
        email: schema.users.email,
        username: schema.users.username,
        displayName: schema.users.displayName,
        profileImageUrl: schema.users.profileImageUrl,
        role: schema.users.role,
        isBanned: schema.users.isBanned,
        bannedAt: schema.users.bannedAt,
        bannedUntil: schema.users.bannedUntil,
        banReason: schema.users.banReason,
        createdAt: schema.users.createdAt,
        updatedAt: schema.users.updatedAt,
      });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'User not found' },
      });
    }

    res.json({ success: true, data: user });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to update user' },
    });
  }
}
