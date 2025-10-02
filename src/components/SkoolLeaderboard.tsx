import React from 'react';
import { CommunityLeaderboard } from './CommunityLeaderboard';

interface SkoolLeaderboardProps {
  communityId: string;
}

/**
 * SkoolLeaderboard - Wrapper component that uses the AI-powered CommunityLeaderboard
 * This provides a consistent interface while leveraging the full AI leaderboard system
 */
export const SkoolLeaderboard: React.FC<SkoolLeaderboardProps> = ({ communityId }) => {
  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <CommunityLeaderboard communityId={communityId} />
    </div>
  );
};