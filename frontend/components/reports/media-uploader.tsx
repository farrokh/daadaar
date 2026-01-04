'use client';

import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useRef, useState } from 'react';
import { validateMediaFile } from '../../lib/validation/report-form-schema';

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
      mediaFilesRef.current.forEach(media => {
        if (media.preview && media.preview.startsWith('blob:')) {
          URL.revokeObjectURL(media.preview);
        }
      });
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
      // Validate file
      const validation = validateMediaFile(file);
      if (!validation.valid) {
        alert(validation.error);
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

          const uploadResponse = await fetch(`${apiUrl}/api/media/upload`, {
            method: 'POST',
            credentials: 'include',
            body: formData,
          });

          if (!uploadResponse.ok) {
            const error = await uploadResponse.json();
            throw new Error(error.error?.message || 'Failed to upload image');
          }

          const { data } = await uploadResponse.json();
          mediaId = data.mediaId;
          s3Key = data.s3Key;
        } else {
          // 1. Request presigned URL from backend for non-images
          const presignedResponse = await fetch(`${apiUrl}/api/media/presigned-url`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
              filename: file.name,
              contentType: file.type,
              fileSize: file.size,
            }),
          });

          if (!presignedResponse.ok) {
            const error = await presignedResponse.json();
            throw new Error(error.error?.message || 'Failed to get upload URL');
          }

          const { data } = await presignedResponse.json();
          mediaId = data.mediaId;
          uploadUrl = data.uploadUrl;
          s3Key = data.s3Key;

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
              await fetch(`${apiUrl}/api/media/${mediaId}`, {
                method: 'DELETE',
                credentials: 'include',
              });
            } catch (cleanupError) {
              console.error('Failed to cleanup media record:', cleanupError);
            }
            throw new Error('Failed to upload file to S3');
          }
        }

        // 3. Update media file with real ID
        setMediaFiles(prev =>
          prev.map(m => {
            if (m.id === tempId) {
              // Revoke old preview URL if it exists (shouldn't happen, but safe)
              if (m.preview && m.preview.startsWith('blob:')) {
                URL.revokeObjectURL(m.preview);
              }
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
                error: error instanceof Error ? error.message : 'Upload failed',
              };
            }
            return m;
          })
        );
      }
    },
    [apiUrl, onMediaUploaded]
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
      await fetch(`${apiUrl}/api/media/${mediaId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      // Remove from local state and revoke preview URL
      setMediaFiles(prev => {
        const mediaToRemove = prev.find(m => m.id === mediaId);
        if (mediaToRemove?.preview && mediaToRemove.preview.startsWith('blob:')) {
          URL.revokeObjectURL(mediaToRemove.preview);
        }
        return prev.filter(m => m.id !== mediaId);
      });
      onMediaRemoved(mediaId);
    } catch (error) {
      console.error('Remove media error:', error);
      alert('Failed to remove media');
    }
  };

  return (
    <div className="space-y-6">
      {/* Drop zone */}
      <div
        className={`relative border-2 border-dashed rounded-3xl p-10 text-center transition-all duration-300 ${
          dragActive
            ? 'border-accent-primary bg-accent-primary/10 scale-[1.02]'
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
          <div className="w-16 h-16 rounded-2xl bg-foreground/5 flex items-center justify-center mb-4 group-hover:bg-accent-primary/20 transition-colors">
            <svg
              className="w-8 h-8 text-foreground/40 group-hover:text-accent-primary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <title>Upload</title>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
          </div>
          <div className="text-foreground">
            <p className="text-xl font-bold mb-1">Drop files here or click to upload</p>
            <p className="text-sm text-foreground/40">Supported: Images, Videos, PDFs, Audio</p>
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
                      <div className="w-8 h-8 border-2 border-accent-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>
              )}
              {!media.preview && (
                <div className="w-full h-32 bg-foreground/5 rounded-2xl flex items-center justify-center mb-3">
                  <span className="text-foreground/40 font-bold uppercase tracking-tight text-xs">
                    {media.file.type.split('/')[1] || 'file'}
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
                      className="bg-accent-primary h-full rounded-full transition-all duration-300 shadow-[0_0_10px_rgba(var(--accent-primary-rgb),0.5)]"
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
                  className="absolute top-4 right-4 bg-foreground/10 hover:bg-red-500/80 text-foreground hover:text-white rounded-full w-8 h-8 flex items-center justify-center backdrop-blur-md transition-all border border-foreground/10 opacity-0 group-hover:opacity-100"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <title>Remove</title>
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
