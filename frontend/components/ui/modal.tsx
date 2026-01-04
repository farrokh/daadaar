'use client';

import type * as React from 'react';
import { useEffect } from 'react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  children: React.ReactNode;
  showCloseButton?: boolean;
}

const Modal = ({
  isOpen,
  onClose,
  title,
  size = 'md',
  children,
  showCloseButton = true,
}: ModalProps) => {
  // Handle ESC key press
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-full mx-4',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
      onKeyDown={e => e.key === 'Enter' && onClose()}
      // biome-ignore lint/a11y/useSemanticElements: <dialog> element has limited browser support, using div with role="dialog" for better compatibility
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      <div
        className={`
          relative w-full ${sizeClasses[size]} 
          bg-background
          rounded-xl shadow-2xl 
          max-h-[90vh] overflow-y-auto
          transform transition-all
          border border-foreground/10
        `}
        onClick={e => e.stopPropagation()}
        onKeyDown={e => e.stopPropagation()}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-foreground/5">
            {title && (
              <h2 id="modal-title" className="text-xl font-semibold text-foreground">
                {title}
              </h2>
            )}
            {showCloseButton && (
              <button
                type="button"
                onClick={onClose}
                className="
                  ml-auto p-2 rounded-lg 
                  text-foreground/40 hover:text-foreground 
                  hover:bg-foreground/5
                  transition-colors
                "
                aria-label="Close modal"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-label="Close icon"
                  role="img"
                >
                  <path d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
};

Modal.displayName = 'Modal';

export { Modal };
export default Modal;
