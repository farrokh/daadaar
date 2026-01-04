/**
 * Voting Hook
 * Custom React hook for managing voting state and operations
 */

import { useCallback, useEffect, useState } from 'react';
import type { GetMyVoteResponse } from '@/shared/api-types';
import { castVote, getMyVote, removeVote } from '@/lib/voting-api';

interface VotingState {
  currentVote: 'upvote' | 'downvote' | null;
  upvoteCount: number;
  downvoteCount: number;
  isLoading: boolean;
  error: string | null;
}

interface UseVotingReturn extends VotingState {
  vote: (voteType: 'upvote' | 'downvote') => Promise<void>;
  unvote: () => Promise<void>;
  refetch: () => Promise<void>;
}

/**
 * Hook for managing voting on a report
 * @param reportId - The report ID to manage voting for
 * @param initialUpvoteCount - Initial upvote count from server
 * @param initialDownvoteCount - Initial downvote count from server
 * @param isAnonymous - Whether the user is anonymous (requires PoW)
 */
export function useVoting(
  reportId: number,
  initialUpvoteCount: number,
  initialDownvoteCount: number,
  isAnonymous: boolean
): UseVotingReturn {
  const [state, setState] = useState<VotingState>({
    currentVote: null,
    upvoteCount: initialUpvoteCount,
    downvoteCount: initialDownvoteCount,
    isLoading: true,
    error: null,
  });

  // Fetch current user's vote on mount
  const fetchVote = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    const response = await getMyVote(reportId);

    if (response.success && response.data) {
      setState(prev => ({
        ...prev,
        currentVote: response.data!.vote?.voteType || null,
        isLoading: false,
      }));
    } else {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: response.error?.message || 'Failed to fetch vote',
      }));
    }
  }, [reportId]);

  // Fetch vote on mount
  useEffect(() => {
    fetchVote();
  }, [fetchVote]);

  // Cast or change vote
  const vote = useCallback(
    async (voteType: 'upvote' | 'downvote') => {
      // Optimistic update
      const previousState = { ...state };
      
      // Calculate optimistic counts
      let newUpvoteCount = state.upvoteCount;
      let newDownvoteCount = state.downvoteCount;

      if (state.currentVote === null) {
        // New vote
        if (voteType === 'upvote') {
          newUpvoteCount += 1;
        } else {
          newDownvoteCount += 1;
        }
      } else if (state.currentVote !== voteType) {
        // Change vote
        if (state.currentVote === 'upvote') {
          newUpvoteCount -= 1;
          newDownvoteCount += 1;
        } else {
          newDownvoteCount -= 1;
          newUpvoteCount += 1;
        }
      }

      setState(prev => ({
        ...prev,
        currentVote: voteType,
        upvoteCount: newUpvoteCount,
        downvoteCount: newDownvoteCount,
        isLoading: true,
        error: null,
      }));

      const response = await castVote(reportId, voteType, isAnonymous);

      if (response.success && response.data) {
        // Update with server counts
        setState(prev => ({
          ...prev,
          currentVote: response.data!.vote.voteType,
          upvoteCount: response.data!.reportVoteCounts.upvoteCount,
          downvoteCount: response.data!.reportVoteCounts.downvoteCount,
          isLoading: false,
        }));
      } else {
        // Revert optimistic update on error
        setState({
          ...previousState,
          error: response.error?.message || 'Failed to cast vote',
        });
      }
    },
    [reportId, isAnonymous, state]
  );

  // Remove vote
  const unvote = useCallback(async () => {
    if (!state.currentVote) return;

    // Optimistic update
    const previousState = { ...state };
    const newUpvoteCount =
      state.currentVote === 'upvote' ? state.upvoteCount - 1 : state.upvoteCount;
    const newDownvoteCount =
      state.currentVote === 'downvote' ? state.downvoteCount - 1 : state.downvoteCount;

    setState(prev => ({
      ...prev,
      currentVote: null,
      upvoteCount: newUpvoteCount,
      downvoteCount: newDownvoteCount,
      isLoading: true,
      error: null,
    }));

    const response = await removeVote(reportId);

    if (response.success && response.data) {
      // Update with server counts
      setState(prev => ({
        ...prev,
        currentVote: null,
        upvoteCount: response.data!.reportVoteCounts.upvoteCount,
        downvoteCount: response.data!.reportVoteCounts.downvoteCount,
        isLoading: false,
      }));
    } else {
      // Revert optimistic update on error
      setState({
        ...previousState,
        error: response.error?.message || 'Failed to remove vote',
      });
    }
  }, [reportId, state]);

  return {
    ...state,
    vote,
    unvote,
    refetch: fetchVote,
  };
}

