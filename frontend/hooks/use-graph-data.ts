import { fetchApi } from '@/lib/api';
import { calculateGridLayout } from '@/lib/graph-layout';
import { calculateOrganizationPeopleLayout } from '@/lib/organization-people-layout';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Edge, Node } from 'reactflow';
import type { ViewContext, ViewMode } from '../components/graph/config';
import type { ReportNodeData } from '../components/graph/types';

interface OrganizationsResponse {
  nodes: Node[];
  edges: Edge[];
}

export interface OrganizationPathItem {
  id: number;
  name: string;
  nameEn?: string | null;
}

interface OrganizationPeopleResponse {
  organization: {
    id: number;
    shareableUuid: string;
    name: string;
    nameEn?: string | null;
    description?: string | null;
    descriptionEn?: string | null;
    logoUrl?: string | null;
    url?: string | null;
    s3Key?: string | null;
    memberCount?: number;
  };
  organizationPath: OrganizationPathItem[];
  nodes: Node[];
  edges: Edge[];
}

interface IndividualReportsResponse {
  individual: {
    id: number;
    shareableUuid: string;
    fullName: string;
    fullNameEn?: string | null;
    biography?: string | null;
    biographyEn?: string | null;
    profileImageUrl?: string | null;
    url?: string | null;
    s3Key?: string | null;
  };
  organizationPath: OrganizationPathItem[];
  nodes: Node[];
  edges: Edge[];
}

interface UseGraphDataProps {
  initialView?: ViewContext;
  tOrg: (key: string) => string;
  tPerson: (key: string) => string;
  locale: string;
}

export const useGraphData = ({ initialView, tOrg, tPerson, locale }: UseGraphDataProps) => {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewContext, setViewContext] = useState<ViewContext>(
    initialView || { mode: 'organizations' }
  );
  const [organizationPath, setOrganizationPath] = useState<OrganizationPathItem[]>([]);

  const [dateRange, setDateRange] = useState<[number, number]>([2000, new Date().getFullYear()]);
  const [timeRangeLimit, setTimeRangeLimit] = useState<[number, number]>([
    2000,
    new Date().getFullYear(),
  ]);

  const [expandedOrgIds, setExpandedOrgIds] = useState<Set<number>>(new Set());

  // Store full graph data
  const allNodesRef = useRef<Node[]>([]);
  const allEdgesRef = useRef<Edge[]>([]);

  // Toggle child organization expansion
  const toggleChildOrgExpansion = useCallback((orgId: number) => {
    setExpandedOrgIds(prev => {
      const next = new Set(prev);
      if (next.has(orgId)) {
        next.delete(orgId);
      } else {
        next.add(orgId);
      }
      return next;
    });
  }, []);

  // Compute visible graph based on expansion state
  useEffect(() => {
    if (viewContext.mode !== 'organizations' || allNodesRef.current.length === 0) return;

    const visibleNodeIds = new Set<string>();
    const visibleEdgeIds = new Set<string>();
    const queue = allNodesRef.current
      .filter(n => !allEdgesRef.current.some(e => e.target === n.id)) // Roots
      .map(n => n.id);

    // Always show roots
    for (const id of queue) {
      visibleNodeIds.add(id);
    }

    // Simple BFS traversal respecting expansion state
    while (queue.length > 0) {
      const parentNodeId = queue.shift();
      if (!parentNodeId) continue;

      // Extract numeric ID
      const parentIdNum = Number.parseInt(parentNodeId.replace('org-', ''), 10);

      // If this node is expanded, show its children
      if (expandedOrgIds.has(parentIdNum)) {
        const children = allEdgesRef.current.filter(
          e => e.source === parentNodeId && e.type === 'hierarchy'
        );

        for (const edge of children) {
          visibleEdgeIds.add(edge.id);
          if (!visibleNodeIds.has(edge.target)) {
            visibleNodeIds.add(edge.target);
            queue.push(edge.target);
          }
        }
      }
    }

    const filteredNodes = allNodesRef.current.filter(n => visibleNodeIds.has(n.id));
    const filteredEdges = allEdgesRef.current.filter(e => visibleEdgeIds.has(e.id));

    // Recalculate layout for visible subset
    const positionedNodes = calculateGridLayout(filteredNodes, filteredEdges);

    setNodes(positionedNodes);
    setEdges(filteredEdges);
  }, [expandedOrgIds, viewContext.mode]);

  // Fetch organizations graph
  const fetchOrganizations = useCallback(async () => {
    setLoading(true);
    setError(null);

    const response = await fetchApi<OrganizationsResponse>('/graph/organizations');

    if (response.success && response.data) {
      const { nodes: rawNodes, edges: rawEdges } = response.data;

      allNodesRef.current = rawNodes;
      allEdgesRef.current = rawEdges;

      // Identify nodes to expand initially (Roots and Level 1)
      // This will make Roots, Level 1, and Level 2 visible

      const rootNodeIds = rawNodes
        .filter(n => !rawEdges.some(e => e.target === n.id && e.type === 'hierarchy'))
        .map(n => (n.data as { id: number }).id);

      setExpandedOrgIds(new Set(rootNodeIds));

      // Update time range limits based on reports if any
      const reportYears = rawNodes
        .filter(n => n.type === 'report')
        .map(n => (n.data as ReportNodeData).incidentDate)
        .filter((d): d is string => !!d)
        .map(d => new Date(d).getFullYear());

      if (reportYears.length > 0) {
        const min = Math.min(...reportYears);
        const max = Math.max(...reportYears);
        setTimeRangeLimit([min, max]);
        setDateRange([min, max]);
      }

      setViewContext({ mode: 'organizations' });
      setOrganizationPath([]); // Clear path when viewing all organizations
    } else {
      setError(response.error?.message || tOrg('error_create_failed'));
    }

    setLoading(false);
  }, [tOrg]);

  // Fetch people in organization
  const fetchOrganizationPeople = useCallback(
    async (organizationId: number, _organizationName?: string) => {
      setLoading(true);
      setError(null);

      const response = await fetchApi<OrganizationPeopleResponse>(
        `/graph/organization/${organizationId}/people`
      );

      if (response.success && response.data) {
        const { organization, nodes: peopleNodes, edges: peopleEdges } = response.data;

        // Create organization node as root with actual data
        const orgNode: Node = {
          id: `org-${organization.id}`,
          type: 'organization',
          data: {
            id: organization.id,
            shareableUuid: organization.shareableUuid,
            name: organization.name,
            nameEn: organization.nameEn,
            description: organization.description,
            descriptionEn: organization.descriptionEn,
            logoUrl: organization.logoUrl,
            url: organization.url,
            s3Key: organization.s3Key,
            isDetailView: true,
            memberCount: organization.memberCount,
          },
          position: { x: 0, y: 0 },
        };

        const allNodes = [orgNode, ...peopleNodes];
        const positionedNodes = calculateOrganizationPeopleLayout(allNodes, peopleEdges);
        const displayName =
          locale === 'en' ? organization.nameEn || organization.name : organization.name;

        setNodes(positionedNodes);
        setEdges(peopleEdges);
        setOrganizationPath(response.data.organizationPath || []); // Store organization path

        // Update time range limits based on role occupancy dates
        const occupancyYears = peopleEdges
          .filter(edge => edge.data?.startDate)
          .flatMap(edge => {
            const years: number[] = [];
            if (edge.data.startDate) {
              years.push(new Date(edge.data.startDate).getFullYear());
            }
            if (edge.data.endDate) {
              years.push(new Date(edge.data.endDate).getFullYear());
            } else {
              // If no end date, include current year
              years.push(new Date().getFullYear());
            }
            return years;
          });

        if (occupancyYears.length > 0) {
          const min = Math.min(...occupancyYears);
          const max = Math.max(...occupancyYears);
          setTimeRangeLimit([min, max]);
          setDateRange([min, max]);
        }

        setViewContext({
          mode: 'people',
          organizationId: organization.id,
          organizationUuid: organization.shareableUuid,
          organizationName: displayName,
        });
      } else {
        setError(response.error?.message || tPerson('error_create_failed'));
      }

      setLoading(false);
    },
    [tPerson, locale]
  );

  // Fetch reports for individual
  const fetchIndividualReports = useCallback(
    async (individualId: number, _individualName?: string) => {
      setLoading(true);
      setError(null);

      const response = await fetchApi<IndividualReportsResponse>(
        `/graph/individual/${individualId}/reports`
      );

      if (response.success && response.data) {
        const { individual, nodes: reportNodes, edges: reportEdges } = response.data;

        // Create individual node as root with actual data
        const individualNode: Node = {
          id: `individual-${individual.id}`,
          type: 'individual',
          data: {
            id: individual.id,
            shareableUuid: individual.shareableUuid,
            name: individual.fullName,
            nameEn: individual.fullNameEn,
            biography: individual.biography,
            biographyEn: individual.biographyEn,
            profileImageUrl: individual.profileImageUrl,
            url: individual.url,
            s3Key: individual.s3Key,
            isDetailView: true,
          },
          position: { x: 0, y: 0 },
        };

        const allNodes = [individualNode, ...reportNodes];
        const positionedNodes = calculateGridLayout(allNodes, reportEdges);
        const displayName =
          locale === 'en' ? individual.fullNameEn || individual.fullName : individual.fullName;

        setNodes(positionedNodes);
        setEdges(reportEdges);
        setOrganizationPath(response.data.organizationPath || []); // Store organization path
        setViewContext({
          mode: 'reports',
          individualId: individual.id,
          individualUuid: individual.shareableUuid,
          individualName: displayName,
        });

        // Update time range limits based on reports
        const reportYears = reportNodes
          .map(n => (n.data as ReportNodeData).incidentDate)
          .filter((d): d is string => !!d)
          .map(d => new Date(d).getFullYear());

        if (reportYears.length > 0) {
          const min = Math.min(...reportYears);
          const max = Math.max(...reportYears);
          setTimeRangeLimit([min, max]);
          setDateRange([min, max]);
        }
      } else {
        setError(response.error?.message || tPerson('error_create_failed'));
      }

      setLoading(false);
    },
    [tPerson, locale]
  );

  return {
    nodes,
    edges,
    loading,
    error,
    viewContext,
    organizationPath,
    dateRange,
    timeRangeLimit,
    setNodes,
    setEdges,
    setDateRange,
    fetchOrganizations,
    fetchOrganizationPeople,
    fetchIndividualReports,
    toggleChildOrgExpansion,
    expandedOrgIds,
  };
};
