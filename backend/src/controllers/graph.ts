// Graph visualization controller
// Handles fetching graph data for organizations, people, and reports

import { and, eq, inArray } from 'drizzle-orm';
import type { Request, Response } from 'express';
import { db, schema } from '../db';

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
        name: schema.organizations.name,
        nameEn: schema.organizations.nameEn,
        description: schema.organizations.description,
        descriptionEn: schema.organizations.descriptionEn,
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

    // Build nodes and edges
    const nodes = organizations.map(org => ({
      id: `org-${org.id}`,
      type: 'organization' as const,
      label: org.name,
      data: {
        id: org.id,
        name: org.name,
        nameEn: org.nameEn,
        description: org.description,
        descriptionEn: org.descriptionEn,
      },
      position: { x: 0, y: 0 }, // Will be calculated on frontend
    }));

    const edges = hierarchies.map(hierarchy => ({
      id: `edge-${hierarchy.parentId}-${hierarchy.childId}`,
      source: `org-${hierarchy.parentId}`,
      target: `org-${hierarchy.childId}`,
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
        name: schema.organizations.name,
        nameEn: schema.organizations.nameEn,
        description: schema.organizations.description,
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

    if (roleIds.length === 0) {
      return res.json({
        success: true,
        data: {
          organization,
          nodes: [],
          edges: [],
        },
      });
    }

    // Fetch all individuals who have/had these roles
    const roleOccupancies = await db
      .select({
        individualId: schema.roleOccupancy.individualId,
        roleId: schema.roleOccupancy.roleId,
        startDate: schema.roleOccupancy.startDate,
        endDate: schema.roleOccupancy.endDate,
      })
      .from(schema.roleOccupancy)
      .where(inArray(schema.roleOccupancy.roleId, roleIds));

    const individualIds = [...new Set(roleOccupancies.map(ro => ro.individualId))];

    if (individualIds.length === 0) {
      return res.json({
        success: true,
        data: {
          organization,
          nodes: [],
          edges: [],
        },
      });
    }

    // Fetch individual details
    const individuals = await db
      .select({
        id: schema.individuals.id,
        fullName: schema.individuals.fullName,
        fullNameEn: schema.individuals.fullNameEn,
        biography: schema.individuals.biography,
        biographyEn: schema.individuals.biographyEn,
      })
      .from(schema.individuals)
      .where(inArray(schema.individuals.id, individualIds));

    // Build nodes and edges
    const nodes = individuals.map(individual => ({
      id: `individual-${individual.id}`,
      type: 'individual' as const,
      label: individual.fullName,
      data: {
        id: individual.id,
        name: individual.fullName,
        nameEn: individual.fullNameEn,
        biography: individual.biography,
        biographyEn: individual.biographyEn,
      },
      position: { x: 0, y: 0 }, // Will be calculated on frontend
    }));

    // Create edges from organization to people (via roles)
    const edges = roleOccupancies.map(occupancy => ({
      id: `edge-org-${organizationId}-individual-${occupancy.individualId}`,
      source: `org-${organizationId}`,
      target: `individual-${occupancy.individualId}`,
      type: 'occupies' as const,
      data: {
        roleId: occupancy.roleId,
        startDate: occupancy.startDate,
        endDate: occupancy.endDate,
      },
    }));

    res.json({
      success: true,
      data: {
        organization,
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
        fullName: schema.individuals.fullName,
        fullNameEn: schema.individuals.fullNameEn,
        biography: schema.individuals.biography,
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

    if (reportIds.length === 0) {
      return res.json({
        success: true,
        data: {
          individual,
          nodes: [],
          edges: [],
        },
      });
    }

    // Fetch report details
    const reports = await db
      .select({
        id: schema.reports.id,
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
        individual,
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
