'use client';

import { useTranslations } from 'next-intl';
import { useCallback, useState } from 'react';
import { fetchApi } from '@/lib/api';

interface ImageUploadResponse {
  mediaId: number;
  s3Key: string;
}

interface ImageUploaderProps {
  label: string;
  currentImageUrl?: string | null;
  onImageUploaded: (s3Key: string) => void;
  disabled?: boolean;
  helperText?: string;
}

export function ImageUploader({
  label,
  currentImageUrl,
  onImageUploaded,
  disabled = false,
  helperText,
}: ImageUploaderProps) {
  const [preview, setPreview] = useState<string | null>(currentImageUrl || null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const t = useTranslations('common');

  const handleFileSelect = useCallback(
    async (file: File) => {
      setError(null);

      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }

      // Validate file size (max 5MB for logos/avatars)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        setError(`File size must be less than ${(maxSize / 1024 / 1024).toFixed(0)}MB`);
        return;
      }

      // Create preview
      const previewUrl = URL.createObjectURL(file);
      setPreview(previewUrl);
      setUploading(true);

      try {
        // Upload to backend (will be converted to AVIF)
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetchApi<ImageUploadResponse>('/media/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.success || !response.data) {
          throw new Error(response.error?.message || 'Failed to upload image');
        }

        // Notify parent with S3 key
        onImageUploaded(response.data.s3Key);
      } catch (err) {
        console.error('Upload error:', err);
        setError(err instanceof Error ? err.message : 'Failed to upload image');
        setPreview(currentImageUrl || null);
      } finally {
        setUploading(false);
      }
    },
    [currentImageUrl, onImageUploaded]
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    setError(null);
    onImageUploaded('');
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
      </label>

      <div className="flex items-center gap-4">
        {/* Preview */}
        <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700">
          {preview ? (
            <>
              <img
                src={preview}
                alt="Preview"
                className="w-full h-full object-cover"
              />
              {uploading && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-8 h-8"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
                />
              </svg>
            </div>
          )}
        </div>

        {/* Upload/Remove buttons */}
        <div className="flex flex-col gap-2">
          <input
            type="file"
            id="image-upload"
            className="hidden"
            accept="image/*"
            onChange={handleFileInput}
            disabled={disabled || uploading}
          />
          <label
            htmlFor="image-upload"
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer ${
              disabled || uploading
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {uploading ? t('loading') : preview ? 'Change' : t('upload')}
          </label>
          {preview && !uploading && (
            <button
              type="button"
              onClick={handleRemove}
              disabled={disabled}
              className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('remove')}
            </button>
          )}
        </div>
      </div>

      {/* Helper text */}
      {helperText && !error && (
        <p className="text-xs text-gray-500 dark:text-gray-400">{helperText}</p>
      )}

      {/* Error message */}
      {error && (
        <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
