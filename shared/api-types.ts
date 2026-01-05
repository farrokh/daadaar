/**
 * Shared API Response Types
 * These types ensure type safety across frontend and backend
 */

// Import and re-export ApiResponse from the canonical definition
import type { ApiResponse } from './types';
export type { ApiResponse } from './types';

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

// Report Types
export interface CreateReportRequest {
  title: string;
  titleEn?: string;
  content: string;
  contentEn?: string;
  incidentDate?: string;
  incidentLocation?: string;
  incidentLocationEn?: string;
  individualId: number;
  roleId?: number;
  mediaIds?: number[];
  powChallengeId: string;
  powSolution: string;
  powSolutionNonce: number;
}

export interface CreateReportResponse {
  reportId: number;
}

// Media Types
export interface GeneratePresignedUrlRequest {
  filename: string;
  contentType: string;
  fileSize: number;
}

export interface GeneratePresignedUrlResponse {
  mediaId: number;
  uploadUrl: string;
  s3Key: string;
  expiresIn: number;
}

export interface UploadImageResponse {
  mediaId: number;
  s3Key: string;
  mimeType: string;
}

// PoW Types
export interface PowChallengeRequest {
  resource: 'report-submission' | 'voting';
}

export interface PowChallengeResponse {
  challengeId: string;
  nonce: string;
  difficulty: number;
  expiresAt: string;
}

// CSRF Types
export interface CsrfTokenResponse {
  csrfToken: string;
}

// Vote Types
export interface CastVoteRequest {
  reportId: number;
  voteType: 'upvote' | 'downvote';
  // PoW is required for anonymous users only
  powChallengeId?: string;
  powSolution?: string;
  powSolutionNonce?: number;
}

export interface CastVoteResponse {
  vote: {
    id: number;
    reportId: number;
    userId: number | null;
    sessionId: string | null;
    voteType: 'upvote' | 'downvote';
    createdAt: string;
    updatedAt: string;
  };
  voteAction: 'created' | 'updated' | 'unchanged';
  reportVoteCounts: {
    upvoteCount: number;
    downvoteCount: number;
  };
}

export interface RemoveVoteRequest {
  // PoW is required for anonymous users only
  powChallengeId?: string;
  powSolution?: string;
  powSolutionNonce?: number;
}

export interface RemoveVoteResponse {
  reportVoteCounts: {
    upvoteCount: number;
    downvoteCount: number;
  };
}

export interface GetMyVoteResponse {
  vote: {
    id: number;
    reportId: number;
    userId: number | null;
    sessionId: string | null;
    voteType: 'upvote' | 'downvote';
    createdAt: string;
    updatedAt: string;
  } | null;
}

// Content Report Types
export interface CreateContentReportRequest {
  contentType: 'report' | 'organization' | 'individual' | 'user' | 'media';
  contentId: number;
  reason: 'spam' | 'misinformation' | 'harassment' | 'inappropriate' | 'duplicate' | 'other';
  description?: string;
}

export interface CreateContentReportResponse {
  contentReportId: number;
}


// Helper function to handle API responses
export function handleApiResponse<T>(response: ApiResponse<T>): T {
  if (!response.success || !response.data) {
    throw new Error(response.error?.message || 'API request failed');
  }
  return response.data;
}

// Helper function to create API error
export function createApiError(
  code: string,
  message: string,
  details?: Record<string, unknown>
): ApiResponse<never> {
  return {
    success: false,
    error: {
      code,
      message,
      details: details,
    },
  };
}

// Helper function to create API success response
export function createApiSuccess<T>(data: T): ApiResponse<T> {
  return {
    success: true,
    data,
  };
}
