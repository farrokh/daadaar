'use client';

import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchApi } from '../../lib/api';
import { validateMediaFile } from '../../lib/validation/report-form-schema';

interface MediaUploadResponse {
  mediaId: number;
  s3Key: string;
}

interface PresignedUrlResponse {
  mediaId: number;
  uploadUrl: string;
  s3Key: string;
}

export interface UploadedMedia {
  id: number;
  file: File;
  uploadUrl: string;
  s3Key: string;
  preview?: string;
  uploading: boolean;
  progress: number;
  error?: string;
}

interface MediaUploaderProps {
  onMediaUploaded: (mediaId: number) => void;
  onMediaRemoved: (mediaId: number) => void;
  apiUrl: string;
}

export function MediaUploader({ onMediaUploaded, onMediaRemoved, apiUrl }: MediaUploaderProps) {
  const [mediaFiles, setMediaFiles] = useState<UploadedMedia[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const _t = useTranslations('common');
  const mediaFilesRef = useRef(mediaFiles);

  // Keep ref in sync with state
  useEffect(() => {
    mediaFilesRef.current = mediaFiles;
  }, [mediaFiles]);

  // Cleanup: revoke all blob URLs on unmount
  useEffect(() => {
    return () => {
      // Revoke all preview URLs when component unmounts
      for (const media of mediaFilesRef.current) {
        if (media.preview?.startsWith('blob:')) {
          URL.revokeObjectURL(media.preview);
        }
      }
    };
  }, []); // Empty deps - only run on unmount

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const uploadFile = useCallback(
    async (file: File) => {
      // Clear any previous general errors
      setGeneralError(null);

      // Validate file
      const validation = validateMediaFile(file);
      if (!validation.valid) {
        // Map validation error to translatable message
        let errorMessage: string;
        if (validation.errorCode === 'FILE_TYPE_NOT_ALLOWED') {
          errorMessage = _t('fileTypeNotAllowed', {
            type: validation.errorData?.type || 'unknown',
          });
        } else if (validation.errorCode === 'FILE_SIZE_EXCEEDS_LIMIT') {
          const size = validation.errorData?.size ?? 0;
          const maxSize = validation.errorData?.maxSize ?? 0;
          errorMessage = _t('fileSizeExceedsLimit', {
            size: size.toFixed(2),
            maxSize: maxSize.toFixed(0),
          });
        } else {
          errorMessage = validation.error || _t('validationError');
        }
        setGeneralError(errorMessage);
        // Clear error after 5 seconds
        setTimeout(() => setGeneralError(null), 5000);
        return;
      }

      // Create preview for images
      let preview: string | undefined;
      if (file.type.startsWith('image/')) {
        preview = URL.createObjectURL(file);
      }

      // Add to media files list with temporary ID
      const tempId = Date.now();
      const newMedia: UploadedMedia = {
        id: tempId,
        file,
        uploadUrl: '',
        s3Key: '',
        preview,
        uploading: true,
        progress: 0,
      };

      setMediaFiles(prev => [...prev, newMedia]);

      try {
        let mediaId: number;
        let s3Key: string;
        let uploadUrl = '';

        if (file.type.startsWith('image/')) {
          // 1. Upload directly to backend for AVIF conversion
          const formData = new FormData();
          formData.append('file', file);

          const response = await fetchApi<MediaUploadResponse>('/media/upload', {
            method: 'POST',
            body: formData,
          });

          if (!response.success || !response.data) {
            throw new Error(response.error?.message || _t('uploadImageFailed'));
          }

          mediaId = response.data.mediaId;
          s3Key = response.data.s3Key;
        } else {
          // 1. Request presigned URL from backend for non-images
          const presignedResponse = await fetchApi<PresignedUrlResponse>('/media/presigned-url', {
            method: 'POST',
            body: JSON.stringify({
              filename: file.name,
              contentType: file.type,
              fileSize: file.size,
            }),
          });

          if (!presignedResponse.success || !presignedResponse.data) {
            throw new Error(presignedResponse.error?.message || _t('getUploadUrlFailed'));
          }

          mediaId = presignedResponse.data.mediaId;
          uploadUrl = presignedResponse.data.uploadUrl;
          s3Key = presignedResponse.data.s3Key;

          // 2. Upload file to S3 using presigned URL
          const s3Response = await fetch(uploadUrl, {
            method: 'PUT',
            headers: {
              'Content-Type': file.type,
            },
            body: file,
          });

          if (!s3Response.ok) {
            // S3 upload failed - cleanup the database record
            try {
              await fetchApi(`/media/${mediaId}`, {
                method: 'DELETE',
              });
            } catch (cleanupError) {
              console.error('Failed to cleanup media record:', cleanupError);
            }
            throw new Error(_t('uploadS3Failed'));
          }
        }

        // 3. Update media file with real ID
        setMediaFiles(prev =>
          prev.map(m => {
            if (m.id === tempId) {
              // Keep preview URL intact so it remains visible after upload
              return { ...m, id: mediaId, uploadUrl, s3Key, uploading: false, progress: 100 };
            }
            return m;
          })
        );

        // Notify parent component
        onMediaUploaded(mediaId);
      } catch (error) {
        console.error('Upload error:', error);
        setMediaFiles(prev =>
          prev.map(m => {
            if (m.id === tempId) {
              // Keep preview URL on error so user can see what failed
              return {
                ...m,
                uploading: false,
                error: error instanceof Error ? error.message : _t('uploadFailed'),
              };
            }
            return m;
          })
        );
      }
    },
    [onMediaUploaded, _t]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        Array.from(e.dataTransfer.files).forEach(uploadFile);
      }
    },
    [uploadFile]
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      Array.from(e.target.files).forEach(uploadFile);
    }
  };

  const removeMedia = async (mediaId: number) => {
    try {
      // Call backend to soft delete
      await fetchApi(`/media/${mediaId}`, {
        method: 'DELETE',
      });

      // Remove from local state and revoke preview URL
      setMediaFiles(prev => {
        const mediaToRemove = prev.find(m => m.id === mediaId);
        if (mediaToRemove?.preview?.startsWith('blob:')) {
          URL.revokeObjectURL(mediaToRemove.preview);
        }
        return prev.filter(m => m.id !== mediaId);
      });
      onMediaRemoved(mediaId);
    } catch (error) {
      console.error('Remove media error:', error);
      setGeneralError(_t('removeMediaFailed'));
      // Clear error after 5 seconds
      setTimeout(() => setGeneralError(null), 5000);
    }
  };

  return (
    <div className="space-y-6">
      {/* General error message */}
      {generalError && (
        <div
          role="alert"
          aria-live="polite"
          className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-red-500 text-sm font-medium"
        >
          {generalError}
        </div>
      )}

      {/* Drop zone */}
      <div
        className={`relative border-2 border-dashed rounded-3xl p-10 text-center transition-all duration-300 ${
          dragActive
            ? 'border-primary bg-primary/10 scale-[1.02]'
            : 'border-foreground/10 hover:border-foreground/20 bg-foreground/5'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          id="media-upload"
          className="hidden"
          multiple
          accept="image/*,video/*,application/pdf,audio/*"
          onChange={handleFileInput}
        />
        <label htmlFor="media-upload" className="cursor-pointer group flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-foreground/5 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
            <svg
              className="w-8 h-8 text-foreground/40 group-hover:text-primary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <title>{_t('upload')}</title>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
          </div>
          <div className="text-foreground">
            <p className="text-xl font-bold mb-1">{_t('dropFilesHere')}</p>
            <p className="text-sm text-foreground/40">{_t('supportedFormats')}</p>
          </div>
        </label>
      </div>

      {/* Uploaded files list */}
      {mediaFiles.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
          {mediaFiles.map(media => (
            <div
              key={media.id}
              className="relative bg-foreground/5 border border-foreground/10 rounded-3xl p-3 group overflow-hidden"
            >
              {/* Preview */}
              {media.preview && (
                <div className="relative h-32 w-full mb-3 rounded-2xl overflow-hidden">
                  <img
                    src={media.preview}
                    alt={media.file.name}
                    className="w-full h-full object-cover transition-transform group-hover:scale-110"
                  />
                  {media.uploading && (
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center">
                      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>
              )}
              {!media.preview && (
                <div className="w-full h-32 bg-foreground/5 rounded-2xl flex items-center justify-center mb-3">
                  <span className="text-foreground/40 font-bold uppercase tracking-tight text-xs">
                    {media.file.type.split('/')[1] || _t('file')}
                  </span>
                </div>
              )}

              {/* File info */}
              <div className="px-1">
                <p className="text-sm font-bold text-foreground truncate mb-1">{media.file.name}</p>
                <p className="text-xs text-foreground/40">
                  {(media.file.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>

              {/* Upload progress */}
              {media.uploading && (
                <div className="mt-3 px-1">
                  <div className="w-full bg-foreground/5 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-primary h-full rounded-full transition-all duration-300 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                      style={{ width: `${media.progress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Error */}
              {media.error && (
                <p className="text-[10px] text-red-500 mt-2 px-1 font-medium">{media.error}</p>
              )}

              {/* Remove button */}
              {!media.uploading && (
                <button
                  type="button"
                  onClick={() => removeMedia(media.id)}
                  className="absolute top-4 right-4 bg-foreground/10 hover:bg-red-500/80 text-foreground hover:text-white rounded-full w-8 h-8 flex items-center justify-center backdrop-blur-md transition-all border border-foreground/10 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary focus:ring-offset-background"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <title>{_t('remove')}</title>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
