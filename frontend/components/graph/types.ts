// Type definitions for graph components

export interface OrganizationNodeData {
  id: number;
  shareableUuid?: string;
  name: string;
  nameEn?: string | null;
  description?: string | null;
  descriptionEn?: string | null;
  logoUrl?: string | null;
  url?: string | null; // Fully-qualified URL (pre-resolved)
  s3Key?: string | null; // Raw S3 key
  isDetailView?: boolean;
  onEdit?: () => void;
}

export interface PersonNodeData {
  id: number;
  shareableUuid?: string;
  name: string;
  nameEn?: string | null;
  biography?: string | null;
  biographyEn?: string | null;
  profileImageUrl?: string | null;
  url?: string | null; // Fully-qualified URL (pre-resolved)
  s3Key?: string | null; // Raw S3 key
  isDetailView?: boolean;
  onEdit?: () => void;
}

export interface ReportNodeData {
  id: number;
  shareableUuid: string;
  title: string;
  titleEn?: string | null;
  content?: string | null;
  contentEn?: string | null;
  incidentDate?: string | null;
  upvoteCount: number;
  downvoteCount: number;
  createdAt: string;
}
