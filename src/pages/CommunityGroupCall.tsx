import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { GroupVideoChat } from '@/components/GroupVideoChat';
import { ModernHeader } from '@/components/ModernHeader';

const CommunityGroupCall: React.FC = () => {
  const { communityId, callId } = useParams<{ communityId: string; callId?: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  const handleExit = () => {
    navigate(`/communities/${communityId}`);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-bg">
        <ModernHeader />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-1/4 mb-6"></div>
            <div className="h-64 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!user || !communityId) {
    return null;
  }

  return (
    <GroupVideoChat
      communityId={communityId}
      callId={callId}
      onExit={handleExit}
      useMockSignaling={true}
      maxParticipants={50}
    />
  );
};

export default CommunityGroupCall;