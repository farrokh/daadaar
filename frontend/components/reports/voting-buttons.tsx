'use client';

import { useVoting } from '@/hooks/use-voting';
import { Loader2, ThumbsDown, ThumbsUp } from 'lucide-react';
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
            flex items-center gap-1 px-2 py-1 rounded-lg transition-colors duration-200
            ${
              currentVote === 'upvote'
                ? 'text-green-500'
                : 'text-foreground/40 hover:text-green-500'
            }
            ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
          title={t('upvote')}
        >
          <ThumbsUp className="w-4 h-4" />
          <span className="text-sm font-medium">{upvoteCount}</span>
        </button>

        {/* Downvote Button */}
        <button
          type="button"
          onClick={handleDownvote}
          disabled={isLoading}
          className={`
            flex items-center gap-1 px-2 py-1 rounded-lg transition-colors duration-200
            ${currentVote === 'downvote' ? 'text-red-500' : 'text-foreground/40 hover:text-red-500'}
            ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
          title={t('downvote')}
        >
          <ThumbsDown className="w-4 h-4" />
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
      <div className="flex items-center gap-2 max-w-fit p-1 rounded-full border border-foreground/10 bg-foreground/[0.02]">
        {/* Upvote Button */}
        <button
          type="button"
          onClick={handleUpvote}
          disabled={isLoading}
          className={`
            group flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-300
            ${
              currentVote === 'upvote'
                ? 'bg-green-500/10 text-green-600'
                : 'text-foreground/50 hover:bg-foreground/5 hover:text-foreground'
            }
            ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
          title={t('upvote')}
        >
          <ThumbsUp
            className={`w-4 h-4 transition-transform duration-300 ${
              currentVote === 'upvote' ? 'scale-110 fill-current' : 'group-hover:scale-110'
            }`}
          />
          <span className="text-sm font-medium tabular-nums">{upvoteCount}</span>
        </button>

        <div className="w-px h-4 bg-foreground/10" />

        {/* Downvote Button */}
        <button
          type="button"
          onClick={handleDownvote}
          disabled={isLoading}
          className={`
            group flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-300
            ${
              currentVote === 'downvote'
                ? 'bg-red-500/10 text-red-600'
                : 'text-foreground/50 hover:bg-foreground/5 hover:text-foreground'
            }
            ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
          title={t('downvote')}
        >
          <span className="text-sm font-medium tabular-nums">{downvoteCount}</span>
          <ThumbsDown
            className={`w-4 h-4 transition-transform duration-300 ${
              currentVote === 'downvote' ? 'scale-110 fill-current' : 'group-hover:scale-110'
            }`}
          />
        </button>
      </div>

      {/* PoW Notice for Anonymous Users */}
      {isAnonymous && isLoading && (
        <div className="text-xs text-foreground/50 flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          {t('solvingPow')}
        </div>
      )}
    </div>
  );
};
