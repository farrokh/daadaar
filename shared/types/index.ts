// Shared TypeScript types between frontend and backend

// ============================================================================
// API Response Types
// ============================================================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    pagination?: {
      page: number;
      limit: number;
      total: number;
    };
    filters?: Record<string, unknown>;
  };
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

// ============================================================================
// User Types
// ============================================================================

export type UserRole = 'user' | 'moderator' | 'admin';
export type OAuthProvider = 'google' | 'github' | 'twitter';

export interface User {
  id: number;
  email: string;
  username: string;
  displayName: string | null;
  profileImageUrl: string | null;
  role: UserRole;
  isBanned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PublicUser {
  id: number;
  username: string;
  displayName: string | null;
  profileImageUrl: string | null;
}

export interface UserTrustScore {
  userId: number;
  trustScore: number;
  highConfidenceReports: number;
  highlyVotedReports: number;
  accurateRoleDataCount: number;
  contributionMonths: number;
  lastUpdated: string;
}

// ============================================================================
// Session Types
// ============================================================================

export interface AnonymousSession {
  sessionId: string;
  createdAt: string;
  lastActivity: string;
  expiresAt: string;
  isBanned: boolean;
}

export interface AuthUser {
  type: 'registered';
  id: number;
  email: string;
  username: string;
  displayName: string | null;
  role: UserRole;
}

export interface AnonymousUser {
  type: 'anonymous';
  sessionId: string;
}

export type CurrentUser = AuthUser | AnonymousUser;

// ============================================================================
// Organization Types
// ============================================================================

export interface Organization {
  id: number;
  name: string;
  nameEn: string | null;
  description: string | null;
  descriptionEn: string | null;
  parentId: number | null;
  createdByUserId: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface OrganizationHierarchy {
  parentId: number;
  childId: number;
  createdByUserId: number | null;
  createdAt: string;
}

// ============================================================================
// Role Types
// ============================================================================

export interface Role {
  id: number;
  organizationId: number;
  title: string;
  titleEn: string | null;
  description: string | null;
  descriptionEn: string | null;
  createdByUserId: number | null;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// Individual Types
// ============================================================================

export interface Individual {
  id: number;
  fullName: string;
  fullNameEn: string | null;
  biography: string | null;
  biographyEn: string | null;
  profileImageUrl: string | null;
  dateOfBirth: string | null;
  createdByUserId: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface RoleOccupancy {
  id: number;
  individualId: number;
  roleId: number;
  startDate: string;
  endDate: string | null;
  createdByUserId: number | null;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// Report Types
// ============================================================================

export interface Report {
  id: number;
  userId: number | null;
  sessionId: string | null;
  title: string;
  titleEn: string | null;
  content: string;
  contentEn: string | null;
  incidentDate: string | null;
  incidentLocation: string | null;
  incidentLocationEn: string | null;
  upvoteCount: number;
  downvoteCount: number;
  isPublished: boolean;
  isDeleted: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReportLink {
  id: number;
  reportId: number;
  individualId: number;
  roleId: number | null;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
}

export interface ReportWithDetails extends Report {
  user?: PublicUser | null;
  anonymous?: boolean;
  reportLinks?: (ReportLink & {
    individual?: Individual;
    role?: Role & { organization?: Organization };
  })[];
  media?: (Media & { url?: string })[];
  aiVerification?: AiVerification | null;
}

// ============================================================================
// Vote Types
// ============================================================================

export type VoteType = 'upvote' | 'downvote';

export interface Vote {
  id: number;
  reportId: number;
  userId: number | null;
  sessionId: string | null;
  voteType: VoteType;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// Media Types
// ============================================================================

export type MediaType = 'image' | 'video' | 'document' | 'audio';

export interface Media {
  id: number;
  reportId: number;
  s3Key: string;
  s3Bucket: string;
  originalFilename: string | null;
  mimeType: string | null;
  mediaType: MediaType;
  fileSizeBytes: number | null;
  uploadedByUserId: number | null;
  uploadedBySessionId: string | null;
  isProcessed: boolean;
  isDeleted: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// AI Verification Types
// ============================================================================

export interface AiVerification {
  id: number;
  reportId: number;
  confidenceScore: number;
  analysisJson: string | null;
  consistencyScore: number | null;
  credibilityScore: number | null;
  factCheckSummary: string | null;
  factCheckSummaryEn: string | null;
  flags: string | null;
  modelUsed: string | null;
  processingTimeMs: number | null;
  isManualOverride: boolean;
  overrideByUserId: number | null;
  overrideReason: string | null;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// Ban Types
// ============================================================================

export type BanTargetType = 'user' | 'session';
export type BanAction = 'ban' | 'unban';

export interface BanHistory {
  id: number;
  targetType: BanTargetType;
  targetUserId: number | null;
  targetSessionId: string | null;
  action: BanAction;
  reason: string | null;
  bannedUntil: string | null;
  bannedByUserId: number;
  createdAt: string;
}

// ============================================================================
// Content Report Types (Moderation)
// ============================================================================

export type ContentReportReason =
  | 'spam'
  | 'misinformation'
  | 'harassment'
  | 'inappropriate'
  | 'duplicate'
  | 'other';

export type ContentReportStatus = 'pending' | 'reviewing' | 'resolved' | 'dismissed';

export type ReportableContentType = 'report' | 'organization' | 'individual' | 'user' | 'media';

export interface ContentReport {
  id: number;
  contentType: ReportableContentType;
  contentId: number;
  reporterUserId: number | null;
  reporterSessionId: string | null;
  reason: ContentReportReason;
  description: string | null;
  status: ContentReportStatus;
  reviewedByUserId: number | null;
  reviewedAt: string | null;
  adminNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// Proof of Work Types
// ============================================================================

export interface PowChallenge {
  challengeId: string;
  resource: string;
  difficulty: number;
  nonce: string;
  expiresAt: string;
}

export interface PowSolution {
  challengeId: string;
  solution: string;
}

// ============================================================================
// Graph Types (for visualization)
// ============================================================================

export interface GraphNode {
  id: string;
  type: 'organization' | 'role' | 'individual' | 'report';
  label: string;
  data: Organization | Role | Individual | Report;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: 'hierarchy' | 'belongs_to' | 'occupies' | 'linked_to';
  data?: RoleOccupancy | ReportLink;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

// ============================================================================
// Search & Filter Types
// ============================================================================

export interface ReportSearchParams extends PaginationParams {
  query?: string;
  organizationId?: number;
  roleId?: number;
  individualId?: number;
  dateFrom?: string;
  dateTo?: string;
  minConfidence?: number;
  maxConfidence?: number;
  sortBy?: 'createdAt' | 'upvoteCount' | 'confidenceScore';
  sortOrder?: 'asc' | 'desc';
}

export interface GraphQueryParams {
  dateFrom?: string;
  dateTo?: string;
  organizationId?: number;
  individualId?: number;
  depth?: number;
}
