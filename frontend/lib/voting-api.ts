/**
 * Voting API Functions
 * Handles all voting-related API calls
 */

import type {
  CastVoteRequest,
  CastVoteResponse,
  GetMyVoteResponse,
  PowChallengeResponse,
  RemoveVoteRequest,
  RemoveVoteResponse,
} from '@/shared/api-types';
import type { ApiResponse } from '@/shared/types';
import { fetchApi } from './api';
import { solvePowChallenge } from './pow-solver';

/**
 * Get a PoW challenge for anonymous voting
 */
async function getPowChallenge(): Promise<PowChallengeResponse> {
  const response = await fetchApi<PowChallengeResponse>('/pow/challenge', {
    method: 'POST',
    body: JSON.stringify({ resource: 'voting' }),
  });

  if (!response.success || !response.data) {
    throw new Error('Failed to get PoW challenge');
  }

  return response.data;
}

/**
 * Cast a vote on a report
 * @param reportId - The report ID to vote on
 * @param voteType - 'upvote' or 'downvote'
 * @param isAnonymous - Whether the user is anonymous (requires PoW)
 * @returns Vote response with updated counts
 */
export async function castVote(
  reportId: number,
  voteType: 'upvote' | 'downvote',
  isAnonymous: boolean
): Promise<ApiResponse<CastVoteResponse>> {
  try {
    // Prepare request body
    const requestBody: CastVoteRequest = {
      reportId,
      voteType,
    };

    // If anonymous, solve PoW challenge
    if (isAnonymous) {
      const challenge = await getPowChallenge();
      const solution = await solvePowChallenge(challenge);

      requestBody.powChallengeId = challenge.challengeId;
      requestBody.powSolution = solution.solution;
      requestBody.powSolutionNonce = solution.solutionNonce;
    }

    // Cast vote
    const response = await fetchApi<CastVoteResponse>('/votes', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    return response;
  } catch (error) {
    console.error('Cast vote error:', error);
    return {
      success: false,
      error: {
        code: 'CAST_VOTE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to cast vote',
      },
    };
  }
}

/**
 * Remove a vote from a report
 * @param reportId - The report ID to remove vote from
 * @param isAnonymous - Whether the user is anonymous (requires PoW)
 * @returns Updated vote counts
 */
export async function removeVote(
  reportId: number,
  isAnonymous: boolean
): Promise<ApiResponse<RemoveVoteResponse>> {
  try {
    // Prepare request body
    const requestBody: RemoveVoteRequest = {};

    // If anonymous, solve PoW challenge
    if (isAnonymous) {
      const challenge = await getPowChallenge();
      const solution = await solvePowChallenge(challenge);

      requestBody.powChallengeId = challenge.challengeId;
      requestBody.powSolution = solution.solution;
      requestBody.powSolutionNonce = solution.solutionNonce;
    }

    // Remove vote
    const response = await fetchApi<RemoveVoteResponse>(`/votes/${reportId}`, {
      method: 'DELETE',
      body: Object.keys(requestBody).length > 0 ? JSON.stringify(requestBody) : undefined,
    });

    return response;
  } catch (error) {
    console.error('Remove vote error:', error);
    return {
      success: false,
      error: {
        code: 'REMOVE_VOTE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to remove vote',
      },
    };
  }
}

/**
 * Get the current user's vote on a report
 * @param reportId - The report ID to check
 * @returns The user's vote or null if not voted
 */
export async function getMyVote(reportId: number): Promise<ApiResponse<GetMyVoteResponse>> {
  try {
    const response = await fetchApi<GetMyVoteResponse>(`/votes/${reportId}/my-vote`);
    return response;
  } catch (error) {
    console.error('Get my vote error:', error);
    return {
      success: false,
      error: {
        code: 'GET_VOTE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to get vote',
      },
    };
  }
}
