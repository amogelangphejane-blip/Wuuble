import React from 'react';
import { SimplifiedLeaderboard } from './SimplifiedLeaderboard';

interface SkoolLeaderboardProps {
  communityId: string;
}

/**
 * SkoolLeaderboard - Gamification leaderboard with points, levels, and achievements
 */
export const SkoolLeaderboard: React.FC<SkoolLeaderboardProps> = ({ communityId }) => {
  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <SimplifiedLeaderboard communityId={communityId} />
    </div>
  );
};