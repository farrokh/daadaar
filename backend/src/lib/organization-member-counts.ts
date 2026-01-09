// Organization member count calculations with Redis caching
// Handles recursive counting of members in organization hierarchies

import { eq, inArray, sql } from 'drizzle-orm';
import { db, schema } from '../db';
import { redis } from './redis';

const CACHE_TTL = 3600; // 1 hour in seconds
const CACHE_KEY_PREFIX = 'org:member_count:';

/**
 * Get all descendant organization IDs for a given organization
 * Uses recursive CTE to traverse the hierarchy
 */
async function getDescendantOrgIds(organizationId: number): Promise<number[]> {
  const result = await db.execute<{ org_id: number }>(sql`
    WITH RECURSIVE descendants AS (
      -- Base case: start with the given organization
      SELECT child_id as org_id
      FROM organization_hierarchy
      WHERE parent_id = ${organizationId}
      
      UNION ALL
      
      -- Recursive case: get children of children
      SELECT h.child_id
      FROM organization_hierarchy h
      INNER JOIN descendants d ON h.parent_id = d.org_id
    )
    SELECT DISTINCT org_id FROM descendants
  `);

  return (result as unknown as { org_id: number }[]).map(row => row.org_id);
}

/**
 * Calculate the total member count for an organization including all sub-organizations
 * This counts unique individuals across the entire hierarchy
 */
async function calculateRecursiveMemberCount(organizationId: number): Promise<number> {
  // Get all descendant organization IDs
  const descendantIds = await getDescendantOrgIds(organizationId);

  // Include the organization itself
  const allOrgIds = [organizationId, ...descendantIds];

  // Count unique individuals across all these organizations
  const [result] = await db
    .select({
      count: sql<number>`count(distinct ${schema.roleOccupancy.individualId})`,
    })
    .from(schema.roles)
    .leftJoin(schema.roleOccupancy, eq(schema.roles.id, schema.roleOccupancy.roleId))
    .where(inArray(schema.roles.organizationId, allOrgIds));

  return Number(result?.count || 0);
}

/**
 * Get recursive member count with Redis caching
 * Falls back to direct calculation if Redis is unavailable
 */
export async function getRecursiveMemberCount(organizationId: number): Promise<number> {
  const cacheKey = `${CACHE_KEY_PREFIX}${organizationId}`;

  try {
    // Try to get from cache
    if (redis) {
      const cached = await redis.get(cacheKey);
      if (cached !== null) {
        return Number.parseInt(cached, 10);
      }
    }
  } catch (error) {
    console.error(`Redis get error for ${cacheKey}:`, error);
    // Continue to calculation if cache fails
  }

  // Calculate the count
  const count = await calculateRecursiveMemberCount(organizationId);

  // Store in cache
  try {
    if (redis) {
      await redis.set(cacheKey, count.toString(), 'EX', CACHE_TTL);
    }
  } catch (error) {
    console.error(`Redis set error for ${cacheKey}:`, error);
    // Don't fail if caching fails
  }

  return count;
}

/**
 * Get recursive member counts for multiple organizations in batch
 * More efficient than calling getRecursiveMemberCount multiple times
 */
export async function getBatchRecursiveMemberCounts(
  organizationIds: number[]
): Promise<Map<number, number>> {
  const counts = new Map<number, number>();
  const uncachedIds: number[] = [];

  // Try to get cached values
  if (redis) {
    try {
      const cacheKeys = organizationIds.map(id => `${CACHE_KEY_PREFIX}${id}`);
      const cachedValues = await redis.mget(...cacheKeys);

      for (let i = 0; i < organizationIds.length; i++) {
        const orgId = organizationIds[i];
        const cached = cachedValues[i];

        if (cached !== null) {
          counts.set(orgId, Number.parseInt(cached, 10));
        } else {
          uncachedIds.push(orgId);
        }
      }
    } catch (error) {
      console.error('Redis mget error:', error);
      // Fall back to calculating all if cache fails
      uncachedIds.push(...organizationIds);
    }
  } else {
    // No Redis, calculate all
    uncachedIds.push(...organizationIds);
  }

  // Calculate uncached values
  if (uncachedIds.length > 0) {
    const calculations = await Promise.all(
      uncachedIds.map(async id => ({
        id,
        count: await calculateRecursiveMemberCount(id),
      }))
    );

    // Store results and cache them
    const cacheOps: Promise<unknown>[] = [];

    for (const { id, count } of calculations) {
      counts.set(id, count);

      if (redis) {
        cacheOps.push(
          redis
            .set(`${CACHE_KEY_PREFIX}${id}`, count.toString(), 'EX', CACHE_TTL)
            .catch(err => console.error(`Redis set error for org ${id}:`, err))
        );
      }
    }

    // Execute cache operations in parallel (don't wait)
    if (cacheOps.length > 0) {
      Promise.all(cacheOps).catch(() => {
        // Ignore cache errors
      });
    }
  }

  return counts;
}

/**
 * Invalidate the member count cache for an organization and all its ancestors
 * Call this when a role occupancy is added/removed
 */
export async function invalidateMemberCountCache(organizationId: number): Promise<void> {
  if (!redis) return;

  try {
    // Get all ancestor organization IDs
    const ancestors = await db.execute<{ org_id: number }>(sql`
      WITH RECURSIVE ancestors AS (
        -- Base case: start with the given organization
        SELECT parent_id as org_id
        FROM organization_hierarchy
        WHERE child_id = ${organizationId}
        
        UNION ALL
        
        -- Recursive case: get parents of parents
        SELECT h.parent_id
        FROM organization_hierarchy h
        INNER JOIN ancestors a ON h.child_id = a.org_id
      )
      SELECT DISTINCT org_id FROM ancestors
    `);

    const ancestorIds = (ancestors as unknown as { org_id: number }[]).map(row => row.org_id);
    const allIds = [organizationId, ...ancestorIds];

    // Delete all cache keys
    const cacheKeys = allIds.map(id => `${CACHE_KEY_PREFIX}${id}`);

    if (cacheKeys.length > 0) {
      await redis.del(...cacheKeys);
      console.log(`Invalidated member count cache for ${cacheKeys.length} organizations`);
    }
  } catch (error) {
    console.error('Error invalidating member count cache:', error);
    // Don't fail if cache invalidation fails
  }
}

/**
 * Invalidate cache for an organization when a role occupancy changes
 * This should be called after adding/removing/updating role occupancies
 */
export async function invalidateMemberCountCacheForRole(roleId: number): Promise<void> {
  if (!redis) return;

  try {
    // Get the organization ID for this role
    const [role] = await db
      .select({ organizationId: schema.roles.organizationId })
      .from(schema.roles)
      .where(eq(schema.roles.id, roleId))
      .limit(1);

    if (role) {
      await invalidateMemberCountCache(role.organizationId);
    }
  } catch (error) {
    console.error('Error invalidating cache for role:', error);
  }
}
