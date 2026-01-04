'use client';

import { useVoting } from '@/hooks/use-voting';
import { useTranslations } from 'next-intl';
import type React from 'react';
import { useEffect, useState } from 'react';

interface VotingButtonsProps {
  reportId: number;
  initialUpvoteCount: number;
  initialDownvoteCount: number;
  isAnonymous: boolean;
  compact?: boolean;
}

export const VotingButtons: React.FC<VotingButtonsProps> = ({
  reportId,
  initialUpvoteCount,
  initialDownvoteCount,
  isAnonymous,
  compact = false,
}) => {
  const t = useTranslations('voting');
  const [mounted, setMounted] = useState(false);

  const { currentVote, upvoteCount, downvoteCount, isLoading, error, vote, unvote } = useVoting(
    reportId,
    initialUpvoteCount,
    initialDownvoteCount,
    isAnonymous
  );

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Show skeleton during SSR
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-foreground/5 animate-pulse">
          <div className="w-4 h-4 bg-foreground/10 rounded" />
          <span className="text-sm text-foreground/40">0</span>
        </div>
        <div className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-foreground/5 animate-pulse">
          <div className="w-4 h-4 bg-foreground/10 rounded" />
          <span className="text-sm text-foreground/40">0</span>
        </div>
      </div>
    );
  }

  const handleUpvote = async () => {
    if (currentVote === 'upvote') {
      await unvote();
    } else {
      await vote('upvote');
    }
  };

  const handleDownvote = async () => {
    if (currentVote === 'downvote') {
      await unvote();
    } else {
      await vote('downvote');
    }
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {/* Upvote Button */}
        <button
          type="button"
          onClick={handleUpvote}
          disabled={isLoading}
          className={`
            flex items-center gap-1 px-3 py-1.5 rounded-lg transition-all duration-200
            ${
              currentVote === 'upvote'
                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                : 'bg-foreground/5 text-foreground/60 hover:bg-foreground/10 hover:text-green-400 border border-transparent'
            }
            ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
          title={t('upvote')}
        >
          <svg
            className="w-4 h-4"
            fill="currentColor"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
          </svg>
          <span className="text-sm font-medium">{upvoteCount}</span>
        </button>

        {/* Downvote Button */}
        <button
          type="button"
          onClick={handleDownvote}
          disabled={isLoading}
          className={`
            flex items-center gap-1 px-3 py-1.5 rounded-lg transition-all duration-200
            ${
              currentVote === 'downvote'
                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                : 'bg-foreground/5 text-foreground/60 hover:bg-foreground/10 hover:text-red-400 border border-transparent'
            }
            ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
          title={t('downvote')}
        >
          <svg
            className="w-4 h-4 rotate-180"
            fill="currentColor"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
          </svg>
          <span className="text-sm font-medium">{downvoteCount}</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Error Message */}
      {error && (
        <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      {/* Voting Buttons */}
      <div className="flex items-center gap-3">
        {/* Upvote Button */}
        <button
          type="button"
          onClick={handleUpvote}
          disabled={isLoading}
          className={`
            flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all duration-200
            ${
              currentVote === 'upvote'
                ? 'bg-green-500/20 text-green-400 border-2 border-green-500/40 shadow-lg shadow-green-500/20'
                : 'bg-foreground/5 text-foreground/70 hover:bg-green-500/10 hover:text-green-400 hover:border-green-500/30 border-2 border-transparent'
            }
            ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          <svg
            className="w-5 h-5"
            fill="currentColor"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
          </svg>
          <div className="flex flex-col items-start">
            <span className="text-xs font-medium opacity-70">{t('upvote')}</span>
            <span className="text-lg font-bold">{upvoteCount}</span>
          </div>
        </button>

        {/* Downvote Button */}
        <button
          type="button"
          onClick={handleDownvote}
          disabled={isLoading}
          className={`
            flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all duration-200
            ${
              currentVote === 'downvote'
                ? 'bg-red-500/20 text-red-400 border-2 border-red-500/40 shadow-lg shadow-red-500/20'
                : 'bg-foreground/5 text-foreground/70 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 border-2 border-transparent'
            }
            ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          <svg
            className="w-5 h-5 rotate-180"
            fill="currentColor"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
          </svg>
          <div className="flex flex-col items-start">
            <span className="text-xs font-medium opacity-70">{t('downvote')}</span>
            <span className="text-lg font-bold">{downvoteCount}</span>
          </div>
        </button>
      </div>

      {/* PoW Notice for Anonymous Users */}
      {isAnonymous && isLoading && (
        <div className="text-xs text-foreground/50 flex items-center gap-2">
          <svg
            className="w-4 h-4 animate-spin"
            fill="none"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          {t('solvingPow')}
        </div>
      )}
    </div>
  );
};

