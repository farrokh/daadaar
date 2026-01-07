import { fetchApi } from '@/lib/api';
import { calculateGridLayout } from '@/lib/graph-layout';
import { useCallback, useState } from 'react';
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

  // Fetch organizations graph
  const fetchOrganizations = useCallback(async () => {
    setLoading(true);
    setError(null);

    const response = await fetchApi<OrganizationsResponse>('/graph/organizations');

    if (response.success && response.data) {
      const positionedNodes = calculateGridLayout(response.data.nodes, response.data.edges);
      setNodes(positionedNodes);
      setEdges(response.data.edges);

      // Update time range limits based on reports if any
      const reportYears = response.data.nodes
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
          },
          position: { x: 0, y: 0 },
        };

        const allNodes = [orgNode, ...peopleNodes];
        const positionedNodes = calculateGridLayout(allNodes, peopleEdges);
        const displayName =
          locale === 'en' ? organization.nameEn || organization.name : organization.name;

        setNodes(positionedNodes);
        setEdges(peopleEdges);
        setOrganizationPath(response.data.organizationPath || []); // Store organization path
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
  };
};
