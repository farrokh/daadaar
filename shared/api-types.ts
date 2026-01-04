/**
 * Shared API Response Types
 * These types ensure type safety across frontend and backend
 */

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

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
): ApiResponse {
  return {
    success: false,
    error: {
      code,
      message,
      ...details,
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
