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
          <ThumbsUp className="w-5 h-5" />
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
          <ThumbsDown className="w-5 h-5" />
          <div className="flex flex-col items-start">
            <span className="text-xs font-medium opacity-70">{t('downvote')}</span>
            <span className="text-lg font-bold">{downvoteCount}</span>
          </div>
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
