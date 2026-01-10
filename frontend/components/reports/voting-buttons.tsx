'use client';

import { useVoting } from '@/hooks/use-voting';
import { Loader2, ThumbsDown, ThumbsUp } from 'lucide-react';
import { useTranslations } from 'next-intl';
import posthog from 'posthog-js';
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
      posthog.capture('vote_removed', {
        reportId,
        previousVote: 'upvote',
        isAnonymous,
      });
    } else {
      await vote('upvote');
      posthog.capture('report_upvoted', {
        reportId,
        previousVote: currentVote,
        isAnonymous,
      });
    }
  };

  const handleDownvote = async () => {
    if (currentVote === 'downvote') {
      await unvote();
      posthog.capture('vote_removed', {
        reportId,
        previousVote: 'downvote',
        isAnonymous,
      });
    } else {
      await vote('downvote');
      posthog.capture('report_downvoted', {
        reportId,
        previousVote: currentVote,
        isAnonymous,
      });
    }
  };

  if (compact) {
    return (
      <div className="flex items-center gap-4 px-2">
        {/* Upvote Button */}
        <button
          type="button"
          onClick={handleUpvote}
          disabled={isLoading}
          className={`
            flex items-center gap-1.5 px-2 py-1 rounded-lg transition-colors duration-200
            ${
              currentVote === 'upvote'
                ? 'text-green-500 font-bold'
                : 'text-foreground/40 hover:text-green-500'
            }
            ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
          title={t('upvote')}
        >
          <ThumbsUp className="w-4 h-4" />
          <span className="text-sm">{upvoteCount}</span>
        </button>

        <div className="w-px h-3 bg-foreground/10" />

        {/* Downvote Button */}
        <button
          type="button"
          onClick={handleDownvote}
          disabled={isLoading}
          className={`
            flex items-center gap-1.5 px-2 py-1 rounded-lg transition-colors duration-200
            ${currentVote === 'downvote' ? 'text-red-500 font-bold' : 'text-foreground/40 hover:text-red-500'}
            ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
          title={t('downvote')}
        >
          <ThumbsDown className="w-4 h-4" />
          <span className="text-sm">{downvoteCount}</span>
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
      <div className="flex items-center gap-1.5 p-1 rounded-full border border-foreground/5 bg-foreground/[0.03]">
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
            className={`w-3.5 h-3.5 transition-transform duration-300 ${
              currentVote === 'upvote' ? 'scale-110 fill-current' : 'group-hover:scale-110'
            }`}
          />
          <span className="text-xs font-bold tabular-nums">{upvoteCount}</span>
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
          <span className="text-xs font-bold tabular-nums">{downvoteCount}</span>
          <ThumbsDown
            className={`w-3.5 h-3.5 transition-transform duration-300 ${
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
