import { and, eq, inArray, sql } from 'drizzle-orm';
import type { Request, Response } from 'express';
import { db, schema } from '../db';
import { getIndividualOrganizationPath, getOrganizationPath } from '../lib/organization-hierarchy';
import { getBatchRecursiveMemberCounts } from '../lib/organization-member-counts';
import { generatePresignedGetUrl } from '../lib/s3-client';

/**
 * GET /api/graph/organizations
 * Get all organizations with their hierarchy relationships
 */
export async function getOrganizationsGraph(_req: Request, res: Response) {
  try {
    // Fetch all organizations
    const organizations = await db
      .select({
        id: schema.organizations.id,
        shareableUuid: schema.organizations.shareableUuid,
        name: schema.organizations.name,
        nameEn: schema.organizations.nameEn,
        description: schema.organizations.description,
        descriptionEn: schema.organizations.descriptionEn,
        logoUrl: schema.organizations.logoUrl,
        parentId: schema.organizations.parentId,
      })
      .from(schema.organizations);

    // Fetch all hierarchy relationships
    const hierarchies = await db
      .select({
        parentId: schema.organizationHierarchy.parentId,
        childId: schema.organizationHierarchy.childId,
      })
      .from(schema.organizationHierarchy);

    // Fetch recursive member counts for all organizations (with Redis caching)
    const organizationIds = organizations.map(org => org.id);
    const memberCountMap = await getBatchRecursiveMemberCounts(organizationIds);

    // Fetch child counts for each organization
    const childCounts = await db
      .select({
        parentId: schema.organizationHierarchy.parentId,
        count: sql<number>`count(${schema.organizationHierarchy.childId})`,
      })
      .from(schema.organizationHierarchy)
      .groupBy(schema.organizationHierarchy.parentId);

    const childCountMap = new Map(childCounts.map(c => [c.parentId, Number(c.count)]));

    // Generate presigned URLs for logos
    const nodes = await Promise.all(
      organizations.map(async org => ({
        id: `org-${org.id}`,
        type: 'organization' as const,
        label: org.name,
        data: {
          id: org.id,
          shareableUuid: org.shareableUuid,
          name: org.name,
          nameEn: org.nameEn,
          description: org.description,
          descriptionEn: org.descriptionEn,
          logoUrl: org.logoUrl,
          s3Key: org.logoUrl, // The raw key from DB
          url: org.logoUrl
            ? org.logoUrl.startsWith('http')
              ? org.logoUrl
              : await generatePresignedGetUrl(org.logoUrl)
            : null,
          memberCount: memberCountMap.get(org.id) || 0, // Recursive count including sub-orgs
          childCount: childCountMap.get(org.id) || 0,
        },
        position: { x: 0, y: 0 }, // Will be calculated on frontend
      }))
    );

    const edges = hierarchies.map(hierarchy => ({
      id: `edge-${hierarchy.parentId}-${hierarchy.childId}`,
      source: `org-${hierarchy.parentId}`,
      target: `org-${hierarchy.childId}`,
      sourceHandle: 'right', // From right side of parent
      targetHandle: 'left', // To left side of child
      type: 'hierarchy' as const,
    }));

    res.json({
      success: true,
      data: {
        nodes,
        edges,
      },
    });
  } catch (error) {
    console.error('Error fetching organizations graph:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch organizations graph',
      },
    });
  }
}

/**
 * GET /api/graph/organization/:id/people
 * Get all people (individuals) associated with an organization through their roles
 */
export async function getOrganizationPeople(req: Request, res: Response) {
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

    // Fetch the organization details
    const [organization] = await db
      .select({
        id: schema.organizations.id,
        shareableUuid: schema.organizations.shareableUuid,
        name: schema.organizations.name,
        nameEn: schema.organizations.nameEn,
        description: schema.organizations.description,
        descriptionEn: schema.organizations.descriptionEn,
        logoUrl: schema.organizations.logoUrl,
      })
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

    // Fetch all roles in this organization
    const roles = await db
      .select({
        id: schema.roles.id,
        title: schema.roles.title,
        titleEn: schema.roles.titleEn,
      })
      .from(schema.roles)
      .where(eq(schema.roles.organizationId, organizationId));

    const roleIds = roles.map(r => r.id);

    // Generate presigned URL for organization logo
    const logoUrl = organization.logoUrl;

    // Count members directly in this organization (excluding sub-orgs)
    const [memberCountResult] = await db
      .select({
        count: sql<number>`count(distinct ${schema.roleOccupancy.individualId})`,
      })
      .from(schema.roles)
      .leftJoin(schema.roleOccupancy, eq(schema.roles.id, schema.roleOccupancy.roleId))
      .where(eq(schema.roles.organizationId, organizationId));

    const memberCount = Number(memberCountResult?.count || 0);

    // Get the organization path for breadcrumb
    // We fetch this early so it's available even if there are no people
    let organizationPath: Awaited<ReturnType<typeof getOrganizationPath>> = [];
    try {
      organizationPath = await getOrganizationPath(organizationId);
    } catch (pathError) {
      console.error('Error getting organization path:', pathError);
    }

    // Fetch child organizations (sub-organizations)
    const childOrganizations = await db
      .select({
        id: schema.organizations.id,
        shareableUuid: schema.organizations.shareableUuid,
        name: schema.organizations.name,
        nameEn: schema.organizations.nameEn,
        description: schema.organizations.description,
        descriptionEn: schema.organizations.descriptionEn,
        logoUrl: schema.organizations.logoUrl,
      })
      .from(schema.organizations)
      .innerJoin(
        schema.organizationHierarchy,
        eq(schema.organizations.id, schema.organizationHierarchy.childId)
      )
      .where(eq(schema.organizationHierarchy.parentId, organizationId));

    // Get member counts for child organizations
    const childOrgIds = childOrganizations.map(org => org.id);

    // Fetch grandchildren (sub-organizations of child organizations)
    const grandChildOrganizations =
      childOrgIds.length > 0
        ? await db
            .select({
              parentId: schema.organizationHierarchy.parentId,
              id: schema.organizations.id,
              shareableUuid: schema.organizations.shareableUuid,
              name: schema.organizations.name,
              nameEn: schema.organizations.nameEn,
              description: schema.organizations.description,
              descriptionEn: schema.organizations.descriptionEn,
              logoUrl: schema.organizations.logoUrl,
            })
            .from(schema.organizations)
            .innerJoin(
              schema.organizationHierarchy,
              eq(schema.organizations.id, schema.organizationHierarchy.childId)
            )
            .where(inArray(schema.organizationHierarchy.parentId, childOrgIds))
        : [];

    const grandChildOrgIds = grandChildOrganizations.map(org => org.id);
    const descendantOrgIds = [...childOrgIds, ...grandChildOrgIds];
    const recursiveMemberCounts =
      descendantOrgIds.length > 0
        ? await getBatchRecursiveMemberCounts(descendantOrgIds)
        : new Map<number, number>();

    const orgWithPresignedLogo = {
      ...organization,
      logoUrl: logoUrl,
      s3Key: logoUrl,
      url: logoUrl
        ? logoUrl.startsWith('http')
          ? logoUrl
          : await generatePresignedGetUrl(logoUrl)
        : null,
      memberCount,
    };

    // Get child counts for child organizations
    const descendantChildCounts =
      descendantOrgIds.length > 0
        ? await db
            .select({
              parentId: schema.organizationHierarchy.parentId,
              count: sql<number>`count(${schema.organizationHierarchy.childId})`,
            })
            .from(schema.organizationHierarchy)
            .where(inArray(schema.organizationHierarchy.parentId, descendantOrgIds))
            .groupBy(schema.organizationHierarchy.parentId)
        : [];

    const childCountMap = new Map(descendantChildCounts.map(c => [c.parentId, Number(c.count)]));

    // Build organization nodes for children
    const childOrgNodes = await Promise.all(
      childOrganizations.map(async org => ({
        id: `org-${org.id}`,
        type: 'organization' as const,
        label: org.name,
        data: {
          id: org.id,
          shareableUuid: org.shareableUuid,
          name: org.name,
          nameEn: org.nameEn,
          description: org.description,
          descriptionEn: org.descriptionEn,
          logoUrl: org.logoUrl,
          s3Key: org.logoUrl,
          url: org.logoUrl
            ? org.logoUrl.startsWith('http')
              ? org.logoUrl
              : await generatePresignedGetUrl(org.logoUrl)
            : null,
          memberCount: recursiveMemberCounts.get(org.id) || 0,
          childCount: childCountMap.get(org.id) || 0,
          parentOrgId: organizationId,
        },
        position: { x: 0, y: 0 }, // Will be calculated on frontend
      }))
    );

    // Fetch all individuals who have/had roles in this organization
    const roleOccupancies =
      roleIds.length > 0
        ? await db
            .select({
              individualId: schema.roleOccupancy.individualId,
              roleId: schema.roleOccupancy.roleId,
              startDate: schema.roleOccupancy.startDate,
              endDate: schema.roleOccupancy.endDate,
            })
            .from(schema.roleOccupancy)
            .where(inArray(schema.roleOccupancy.roleId, roleIds))
        : [];

    const individualIds = [...new Set(roleOccupancies.map(ro => ro.individualId))];

    // Fetch individual details when there are matching occupancies
    const individuals =
      individualIds.length > 0
        ? await db
            .select({
              id: schema.individuals.id,
              shareableUuid: schema.individuals.shareableUuid,
              fullName: schema.individuals.fullName,
              fullNameEn: schema.individuals.fullNameEn,
              biography: schema.individuals.biography,
              biographyEn: schema.individuals.biographyEn,
              profileImageUrl: schema.individuals.profileImageUrl,
            })
            .from(schema.individuals)
            .where(inArray(schema.individuals.id, individualIds))
        : [];

    // Build grandchild organization nodes (sub-organizations of child orgs)
    const grandChildOrgNodes = await Promise.all(
      grandChildOrganizations.map(async org => ({
        id: `org-${org.id}`,
        type: 'organization' as const,
        label: org.name,
        data: {
          id: org.id,
          shareableUuid: org.shareableUuid,
          name: org.name,
          nameEn: org.nameEn,
          description: org.description,
          descriptionEn: org.descriptionEn,
          logoUrl: org.logoUrl,
          s3Key: org.logoUrl,
          url: org.logoUrl
            ? org.logoUrl.startsWith('http')
              ? org.logoUrl
              : await generatePresignedGetUrl(org.logoUrl)
            : null,
          memberCount: recursiveMemberCounts.get(org.id) || 0,
          childCount: childCountMap.get(org.id) || 0,
          parentOrgId: org.parentId,
        },
        position: { x: 0, y: 0 }, // Will be calculated on frontend
      }))
    );

    // Build individual nodes
    const individualNodes = await Promise.all(
      individuals.map(async individual => ({
        id: `individual-${individual.id}`,
        type: 'individual' as const,
        label: individual.fullName,
        data: {
          id: individual.id,
          shareableUuid: individual.shareableUuid,
          name: individual.fullName,
          nameEn: individual.fullNameEn,
          biography: individual.biography,
          biographyEn: individual.biographyEn,
          profileImageUrl: individual.profileImageUrl,
          s3Key: individual.profileImageUrl, // The raw key from DB
          url: individual.profileImageUrl
            ? individual.profileImageUrl.startsWith('http')
              ? individual.profileImageUrl
              : await generatePresignedGetUrl(individual.profileImageUrl)
            : null,
        },
        position: { x: 0, y: 0 }, // Will be calculated on frontend
      }))
    );

    // Combine all nodes (child orgs, grandchild orgs, individuals)
    const nodes = [...childOrgNodes, ...grandChildOrgNodes, ...individualNodes];

    // Create edges from organization to people (via roles)
    // Connect from RIGHT side of org to LEFT side of individual
    const peopleEdges = roleOccupancies.map(occupancy => ({
      id: `edge-org-${organizationId}-individual-${occupancy.individualId}`,
      source: `org-${organizationId}`,
      target: `individual-${occupancy.individualId}`,
      sourceHandle: 'right', // From right side of organization
      targetHandle: 'left', // To left side of individual
      type: 'occupies' as const,
      data: {
        roleId: occupancy.roleId,
        startDate: occupancy.startDate,
        endDate: occupancy.endDate,
      },
    }));

    // Create edges from organization to child organizations
    // Connect from LEFT side of org to RIGHT side of child org
    const childHierarchyEdges = childOrganizations.map(childOrg => ({
      id: `edge-org-${organizationId}-org-${childOrg.id}`,
      source: `org-${organizationId}`,
      target: `org-${childOrg.id}`,
      sourceHandle: 'left', // From left side of parent organization
      targetHandle: 'right', // To right side of child organization
      type: 'hierarchy' as const,
    }));

    // Create edges from child organizations to their sub-organizations
    const grandChildHierarchyEdges = grandChildOrganizations.map(childOrg => ({
      id: `edge-org-${childOrg.parentId}-org-${childOrg.id}`,
      source: `org-${childOrg.parentId}`,
      target: `org-${childOrg.id}`,
      sourceHandle: 'left',
      targetHandle: 'right',
      type: 'hierarchy' as const,
    }));

    const hierarchyEdges = [...childHierarchyEdges, ...grandChildHierarchyEdges];

    // Combine all edges
    const edges = [...hierarchyEdges, ...peopleEdges];

    res.json({
      success: true,
      data: {
        organization: orgWithPresignedLogo,
        organizationPath, // Full path from root to current organization
        nodes,
        edges,
      },
    });
  } catch (error) {
    console.error('Error fetching organization people:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch organization people',
      },
    });
  }
}

/**
 * GET /api/graph/individual/:id/reports
 * Get all reports associated with an individual
 */
export async function getIndividualReports(req: Request, res: Response) {
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

    // Fetch the individual details
    const [individual] = await db
      .select({
        id: schema.individuals.id,
        shareableUuid: schema.individuals.shareableUuid,
        fullName: schema.individuals.fullName,
        fullNameEn: schema.individuals.fullNameEn,
        biography: schema.individuals.biography,
        biographyEn: schema.individuals.biographyEn,
        profileImageUrl: schema.individuals.profileImageUrl,
      })
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

    // Fetch all reports linked to this individual
    const reportLinks = await db
      .select({
        reportId: schema.reportLinks.reportId,
        roleId: schema.reportLinks.roleId,
        startDate: schema.reportLinks.startDate,
        endDate: schema.reportLinks.endDate,
      })
      .from(schema.reportLinks)
      .where(eq(schema.reportLinks.individualId, individualId));

    const reportIds = reportLinks.map(rl => rl.reportId);

    // Generate presigned URL for individual profile image
    const individualWithPresignedImage = {
      ...individual,
      profileImageUrl: individual.profileImageUrl,
      s3Key: individual.profileImageUrl,
      url: individual.profileImageUrl
        ? individual.profileImageUrl.startsWith('http')
          ? individual.profileImageUrl
          : await generatePresignedGetUrl(individual.profileImageUrl)
        : null,
    };

    // Get the organization path for this individual
    // Fetch early so it's available even if there are no reports
    let organizationPath: Awaited<ReturnType<typeof getIndividualOrganizationPath>> = [];
    try {
      organizationPath = await getIndividualOrganizationPath(individualId);
    } catch (pathError) {
      console.error('Error getting individual organization path:', pathError);
    }

    if (reportIds.length === 0) {
      return res.json({
        success: true,
        data: {
          individual: individualWithPresignedImage,
          organizationPath,
          nodes: [],
          edges: [],
        },
      });
    }

    // Fetch report details
    const reports = await db
      .select({
        id: schema.reports.id,
        shareableUuid: schema.reports.shareableUuid,
        title: schema.reports.title,
        titleEn: schema.reports.titleEn,
        content: schema.reports.content,
        contentEn: schema.reports.contentEn,
        incidentDate: schema.reports.incidentDate,
        upvoteCount: schema.reports.upvoteCount,
        downvoteCount: schema.reports.downvoteCount,
        createdAt: schema.reports.createdAt,
      })
      .from(schema.reports)
      .where(
        and(
          inArray(schema.reports.id, reportIds),
          eq(schema.reports.isPublished, true),
          eq(schema.reports.isDeleted, false)
        )
      );

    // Build nodes and edges
    const nodes = reports.map(report => ({
      id: `report-${report.id}`,
      type: 'report' as const,
      label: report.title,
      data: {
        id: report.id,
        shareableUuid: report.shareableUuid,
        title: report.title,
        titleEn: report.titleEn,
        content: report.content,
        contentEn: report.contentEn,
        incidentDate: report.incidentDate,
        upvoteCount: report.upvoteCount,
        downvoteCount: report.downvoteCount,
        createdAt: report.createdAt.toISOString(), // Ensure date is string for shared type
      },
      position: { x: 0, y: 0 }, // Will be calculated on frontend
    }));

    // Create edges from person to reports
    const edges = reportLinks
      .filter(rl => reports.some(r => r.id === rl.reportId))
      .map(link => ({
        id: `edge-individual-${individualId}-report-${link.reportId}`,
        source: `individual-${individualId}`,
        target: `report-${link.reportId}`,
        type: 'linked_to' as const,
        data: {
          roleId: link.roleId,
          startDate: link.startDate,
          endDate: link.endDate,
        },
      }));

    res.json({
      success: true,
      data: {
        individual: individualWithPresignedImage,
        organizationPath, // Full path from root organization to individual's organization
        nodes,
        edges,
      },
    });
  } catch (error) {
    console.error('Error fetching individual reports:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch individual reports',
      },
    });
  }
}
