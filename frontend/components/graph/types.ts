// Type definitions for graph components

export interface OrganizationNodeData {
  id: number;
  name: string;
  nameEn?: string | null;
  description?: string | null;
}

export interface PersonNodeData {
  id: number;
  name: string;
  nameEn?: string | null;
  biography?: string | null;
}

export interface ReportNodeData {
  id: number;
  title: string;
  titleEn?: string | null;
  content?: string | null;
  incidentDate?: string | null;
  upvoteCount: number;
  downvoteCount: number;
  createdAt: string;
}
