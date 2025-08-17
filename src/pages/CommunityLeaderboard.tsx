import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CommunityLeaderboard } from '@/components/CommunityLeaderboard';
import { useAuth } from '@/hooks/useAuth';

const CommunityLeaderboardPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  if (!id) {
    navigate('/communities');
    return null;
  }

  if (!user) {
    navigate('/auth');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/communities/${id}`)}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Community
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">
              Community Leaderboard
            </h1>
          </div>
        </div>

        {/* Leaderboard Component */}
        <CommunityLeaderboard communityId={id} />
      </div>
    </div>
  );
};

export default CommunityLeaderboardPage;