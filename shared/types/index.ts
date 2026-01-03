// Shared TypeScript types between frontend and backend

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
