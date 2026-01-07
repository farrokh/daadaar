// Helper functions for organization hierarchy
// Provides utilities to work with organizational hierarchies

import { eq } from 'drizzle-orm';
import { db, schema } from '../db';

export interface OrganizationPathItem {
  id: number;
  name: string;
  nameEn?: string | null;
}

/**
 * Get the full path from a child organization up to the root parent
 * Returns an array of organizations from root (index 0) to the child (last index)
 * @param organizationId - The ID of the organization to get the path for
 * @returns Array of organizations from root to child
 */
export async function getOrganizationPath(organizationId: number): Promise<OrganizationPathItem[]> {
  const path: OrganizationPathItem[] = [];
  let currentId: number | null = organizationId;

  // Prevent infinite loops in case of circular references
  const visited = new Set<number>();
  const maxDepth = 50; // Reasonable max depth to prevent infinite loops
  let depth = 0;

  while (currentId !== null && depth < maxDepth) {
    if (visited.has(currentId)) {
      console.error(`Circular reference detected in organization hierarchy at ID ${currentId}`);
      break;
    }

    visited.add(currentId);

    // Fetch the current organization
    const [org] = await db
      .select({
        id: schema.organizations.id,
        name: schema.organizations.name,
        nameEn: schema.organizations.nameEn,
        parentId: schema.organizations.parentId,
      })
      .from(schema.organizations)
      .where(eq(schema.organizations.id, currentId));

    if (!org) {
      console.error(`Organization with ID ${currentId} not found in path traversal`);
      break;
    }

    // Add to path (we'll reverse later to get root-to-child order)
    path.unshift({
      id: org.id,
      name: org.name,
      nameEn: org.nameEn,
    });

    // Move to parent
    currentId = org.parentId;
    depth++;
  }

  if (depth >= maxDepth) {
    console.error(
      `Maximum depth reached when traversing organization hierarchy for ID ${organizationId}`
    );
  }

  return path;
}

/**
 * Get the full path for an individual through their primary organization
 * @param individualId - The ID of the individual
 * @returns Array of organizations from root to the individual's organization, or empty array if no role found
 */
export async function getIndividualOrganizationPath(
  individualId: number
): Promise<OrganizationPathItem[]> {
  // Get the individual's primary role (most recent active role)
  const [roleOccupancy] = await db
    .select({
      roleId: schema.roleOccupancy.roleId,
    })
    .from(schema.roleOccupancy)
    .where(eq(schema.roleOccupancy.individualId, individualId))
    .orderBy(schema.roleOccupancy.startDate)
    .limit(1);

  if (!roleOccupancy) {
    return [];
  }

  // Get the role to find its organization
  const [role] = await db
    .select({
      organizationId: schema.roles.organizationId,
    })
    .from(schema.roles)
    .where(eq(schema.roles.id, roleOccupancy.roleId));

  if (!role) {
    return [];
  }

  // Get the organization path
  return getOrganizationPath(role.organizationId);
}
