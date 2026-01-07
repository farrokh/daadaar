'use client';

import { cn } from '@/lib/utils';
import { Check, Share2 } from 'lucide-react';
import { type ComponentProps, useState } from 'react';

import { Button } from './button';

type ButtonVariant = ComponentProps<typeof Button>['variant'];
type ButtonSize = ComponentProps<typeof Button>['size'];

interface ShareLinkButtonProps {
  variant?: 'icon' | 'text';
  label?: string;
  copiedLabel?: string;
  errorLabel?: string;
  toastText?: string;
  showToast?: boolean;
  buttonVariant?: ButtonVariant;
  buttonSize?: ButtonSize;
  className?: string;
  iconClassName?: string;
  ariaLabel?: string;
}

export function ShareLinkButton({
  variant = 'text',
  label,
  copiedLabel,
  errorLabel,
  toastText,
  showToast = false,
  buttonVariant = 'ghost',
  buttonSize,
  className,
  iconClassName,
  ariaLabel,
}: ShareLinkButtonProps) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setError(false);
      setToastVisible(true);

      window.setTimeout(() => setCopied(false), 2000);
      window.setTimeout(() => setToastVisible(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
      setError(true);
      setToastVisible(true);
      window.setTimeout(() => {
        setError(false);
        setToastVisible(false);
      }, 2000);
    }
  };

  const content =
    variant === 'icon' ? (
      <Share2 className={cn('w-5 h-5', iconClassName)} />
    ) : (
      <div className="flex items-center gap-2">
        {copied ? (
          <Check className={cn('w-4 h-4', iconClassName)} />
        ) : (
          <Share2 className={cn('w-4 h-4', iconClassName)} />
        )}
        <span className="text-sm font-medium">
          {error ? (errorLabel ?? 'Error') : copied ? (copiedLabel ?? label) : label}
        </span>
      </div>
    );

  return (
    <>
      <Button
        type="button"
        variant={buttonVariant}
        size={buttonSize ?? (variant === 'icon' ? 'icon' : 'sm')}
        onClick={handleShare}
        aria-label={ariaLabel ?? label ?? 'Share'}
        className={className}
      >
        {content}
      </Button>

      {showToast && toastVisible && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-top-2 fade-in">
          <div
            className={`px-4 py-2 rounded-full shadow-lg text-sm font-medium ${
              error ? 'bg-destructive text-destructive-foreground' : 'bg-foreground text-background'
            }`}
          >
            {error ? 'Failed to copy link' : (toastText ?? copiedLabel ?? label)}
          </div>
        </div>
      )}
    </>
  );
}
