'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Check, type LucideIcon, Share2 } from 'lucide-react';
import Link from 'next/link';
import posthog from 'posthog-js';
import { useState } from 'react';

interface PillButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  icon?: LucideIcon;
  href?: string;
  onClick?: () => void;
  action?: 'share' | 'default';
  className?: string;
  copiedLabel?: string;
  errorLabel?: string;
}

export function PillButton({
  label,
  icon: Icon,
  href,
  onClick,
  action = 'default',
  className,
  copiedLabel = 'Copied!',
  errorLabel = 'Error',
  ...props
}: PillButtonProps) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(false);

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setError(false);

      // Track successful link share
      posthog.capture('link_shared', {
        url: window.location.href,
        pathname: window.location.pathname,
      });

      window.setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
      setError(true);
      window.setTimeout(() => setError(false), 2000);
    }
  };

  const handleClick = () => {
    if (action === 'share') {
      handleShare();
    }
    if (onClick) {
      onClick();
    }
  };

  const baseClasses = cn(
    'inline-flex items-center justify-center gap-2 text-[11px] font-bold uppercase tracking-widest text-foreground/50 hover:text-foreground transition-all duration-300 bg-transparent hover:bg-foreground/[0.02] px-3 h-8 rounded-full cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-foreground/10 disabled:pointer-events-none disabled:opacity-50',
    className
  );

  // Determine Icon to show
  const DisplayIcon = action === 'share' && copied ? Check : Icon;
  const displayLabel =
    action === 'share' ? (error ? errorLabel : copied ? copiedLabel : label) : label;

  if (href && action !== 'share') {
    return (
      <Link href={href} className={baseClasses} {...(props as any)}>
        {DisplayIcon && <DisplayIcon className="w-3.5 h-3.5 shrink-0" />}
        {displayLabel && <span>{displayLabel}</span>}
      </Link>
    );
  }

  return (
    <button type="button" onClick={handleClick} className={baseClasses} {...props}>
      {DisplayIcon && <DisplayIcon className="w-3.5 h-3.5 shrink-0" />}
      {displayLabel && <span>{displayLabel}</span>}
    </button>
  );
}
