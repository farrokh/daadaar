import { z } from 'zod';

/**
 * Zod validation schema for report submission form
 */
export const reportFormSchema = z.object({
  // Required fields
  title: z
    .string()
    .min(10, 'Title must be at least 10 characters')
    .max(500, 'Title must not exceed 500 characters'),
  content: z
    .string()
    .min(50, 'Content must be at least 50 characters')
    .max(10000, 'Content must not exceed 10,000 characters'),
  individualId: z.number().int().positive('Individual is required'),

  // Optional fields
  titleEn: z.string().max(500).optional(),
  contentEn: z.string().max(10000).optional(),
  incidentDate: z.string().optional(), // ISO date string
  incidentLocation: z.string().max(255).optional(),
  incidentLocationEn: z.string().max(255).optional(),
  roleId: z.number().int().positive().optional(),

  // Media files (array of media IDs)
  mediaIds: z.array(z.number().int().positive()).optional(),
});

export type ReportFormData = z.infer<typeof reportFormSchema>;

/**
 * Validate a single media file
 * Returns structured error information for i18n support
 */
export function validateMediaFile(file: File): {
  valid: boolean;
  error?: string;
  errorCode?: 'FILE_TYPE_NOT_ALLOWED' | 'FILE_SIZE_EXCEEDS_LIMIT';
  errorData?: { type?: string; size?: number; maxSize?: number };
} {
  const maxSizes: Record<string, number> = {
    image: 50 * 1024 * 1024, // 50MB
    video: 200 * 1024 * 1024, // 200MB
    document: 10 * 1024 * 1024, // 10MB
    audio: 20 * 1024 * 1024, // 20MB
  };

  const allowedTypes: Record<string, string> = {
    'image/jpeg': 'image',
    'image/png': 'image',
    'image/webp': 'image',
    'image/gif': 'image',
    'video/mp4': 'video',
    'video/webm': 'video',
    'video/quicktime': 'video',
    'application/pdf': 'document',
    'audio/mpeg': 'audio',
    'audio/wav': 'audio',
    'audio/ogg': 'audio',
  };

  const mediaType = allowedTypes[file.type];

  if (!mediaType) {
    return {
      valid: false,
      error: `File type ${file.type} is not allowed`,
      errorCode: 'FILE_TYPE_NOT_ALLOWED',
      errorData: { type: file.type },
    };
  }

  const maxSize = maxSizes[mediaType];
  if (file.size > maxSize) {
    const maxSizeMB = maxSize / (1024 * 1024);
    const fileSizeMB = file.size / (1024 * 1024);
    return {
      valid: false,
      error: `File size ${fileSizeMB.toFixed(2)}MB exceeds maximum ${maxSizeMB}MB`,
      errorCode: 'FILE_SIZE_EXCEEDS_LIMIT',
      errorData: {
        size: Number(fileSizeMB.toFixed(2)),
        maxSize: maxSizeMB,
      },
    };
  }

  return { valid: true };
}
